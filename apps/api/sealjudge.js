// sealjudge — the sealed verdict, for real: judge prompt → 0G Compute TEE inference
// (via the SEAL backend) → rubric-validated verdict → CookedRegistry.attest() on
// Galileo. Refuses to seal if the on-chain rubricHash doesn't match our rubric.md —
// a sealed verdict must mean exactly what the frozen rubric says it means.
import { readFileSync } from "node:fs";
import { keccak256 } from "js-sha3";
import {
  buildJudgePrompt, parseVerdict, computeComponents, computeScore, band,
  scoreHash, attestationHash, RUBRIC_VERSION,
} from "./judge.js";
import { LiveBackend } from "./seal-core.js";

const REGISTRY_ADDR = process.env.COOKED_REGISTRY || "0x5d6093C9C6f9118dBD6ae87770dB1E964D06CFcE";
const OG_RPC = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const EXPLORER = process.env.OG_EXPLORER || "https://chainscan-galileo.0g.ai";

const rubric = readFileSync(new URL("./rubric.md", import.meta.url), "utf8");
const RUBRIC_HASH = "0x" + keccak256(rubric);
const backend = new LiveBackend();

let rubricOnChainOk = null;
async function assertRegistryRubric() {
  if (rubricOnChainOk !== null) return rubricOnChainOk;
  const sel = "0x" + keccak256("rubricHash()").slice(0, 8);
  const r = await fetch(OG_RPC, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: REGISTRY_ADDR, data: sel }, "latest"] }),
  });
  const out = (await r.json()).result;
  rubricOnChainOk = typeof out === "string" && out.toLowerCase() === RUBRIC_HASH.toLowerCase();
  if (!rubricOnChainOk) console.error(`[sealjudge] registry rubricHash ${out} != local ${RUBRIC_HASH} — sealing disabled`);
  return rubricOnChainOk;
}

// The full surfaces JSON for a heavy wallet is >1MB — far beyond a TEE chat window.
// The judge gets a faithful digest: everything the rubric formulas consume (per-tier
// wound counts, incident matches, ghost items, behavioral score) plus a sample of the
// worst wounds for evidence lines. The reference verdict below is computed from the
// FULL report with the same tier definitions, so nothing is lost by the slimming.
function slimForJudge(report) {
  const a = report.surfaces.approvals ?? {};
  const items = a.items ?? [];
  const byRisk = {};
  for (const r of ["critical", "high", "medium", "low"]) byRisk[r] = items.filter(w => w.risk === r).length;
  return {
    address: report.resolved ?? report.address,
    surfaces: {
      incidents: { matches: (report.surfaces.incidents?.matches ?? []).map(m => ({ target: m.target, lostUSD: m.lostUSD, date: m.date })) },
      ghost: { items: (report.surfaces.ghost?.items ?? []).map(g => ({ where: g.where })) },
      behavioral: { score: report.surfaces.behavioral?.score ?? 0, note: report.surfaces.behavioral?.note },
      approvals: items.length || a.chainsScanned
        ? { chainsScanned: a.chainsScanned, skipped: a.skipped, counts: a.counts, byRisk,
            worst: items.slice(0, 8).map(w => ({ token: w.symbol, spender: w.spenderLabel ?? w.spender, chain: w.chain, risk: w.risk, unlimited: w.unlimited })),
            items } // items kept for computeComponents parity below; stripped before prompting
        : (a.status ? { status: a.status } : a),
    },
  };
}

function referenceVerdict(report) {
  const { components, pendingFeeds } = computeComponents(report.surfaces);
  const score = computeScore(components);
  const m = report.surfaces.incidents?.matches ?? [];
  const counts = report.surfaces.approvals?.counts ?? {};
  const evidence = [
    m.length ? `${m.length} incident-registry matches, worst: ${m[0]?.target}` : "no incident-registry matches",
    counts.total ? `${counts.total} live approvals still open (${counts.critical ?? 0} critical)` : "approvals surface clean or pending",
  ];
  return {
    rubricVersion: RUBRIC_VERSION, address: report.resolved ?? report.address,
    score, band: band(score), partial: pendingFeeds.length > 0, pendingFeeds,
    components, evidence,
    roast: "The chain never forgets — and neither does this rubric.",
  };
}

async function findAttestTx(sh) {
  const topic0 = "0x" + keccak256("Attested(bytes32,bytes32,address,uint64)");
  const r = await fetch(OG_RPC, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getLogs",
      params: [{ address: REGISTRY_ADDR, fromBlock: "0x1", toBlock: "latest", topics: [topic0, sh] }] }),
  });
  const logs = (await r.json()).result;
  return Array.isArray(logs) && logs[0] ? logs[0].transactionHash : null;
}

/** Seal a completed report: TEE inference, rubric validation, on-chain attest. */
export async function sealReport(report) {
  if (!(await assertRegistryRubric())) throw new Error("registry rubricHash mismatch — sealing disabled");
  const slim = slimForJudge(report);
  const ref = referenceVerdict(report);
  const promptSurfaces = JSON.parse(JSON.stringify(slim));
  if (promptSurfaces.surfaces.approvals?.items) delete promptSurfaces.surfaces.approvals.items;
  const prompt = buildJudgePrompt(rubric, promptSurfaces) + [
    "", "=== REFERENCE (deterministic component math from the full surfaces) ===",
    JSON.stringify(ref),
    "Recompute the weighted score from the rubric and the surfaces above. If your math",
    "agrees with the REFERENCE, return the REFERENCE JSON with ONE change: write your",
    "own roast (≤140 chars, mock the data, never the person). If it disagrees, return",
    "your corrected JSON. ONLY the JSON object.", "",
  ].join("\n");

  let verdict = null, attestation = null, lastErr = null;
  for (let attempt = 0; attempt < 2 && !verdict; attempt++) {
    const r = await backend.infer(prompt);
    attestation = r.attestation;
    try { verdict = parseVerdict(r.output); }
    catch (e) { lastErr = e; }
  }
  if (!verdict) throw new Error(`TEE output violated the rubric twice: ${lastErr?.message}`);

  const sh = scoreHash(verdict), ah = attestationHash(attestation);
  const data = "0x" + keccak256("attest(bytes32,bytes32)").slice(0, 8) + sh.slice(2) + ah.slice(2);
  let txHash;
  try { ({ txHash } = await backend.chainCall(REGISTRY_ADDR, data)); }
  catch (e) {
    // The registry is idempotent per scoreHash — an identical verdict is already
    // anchored. Recover the ORIGINAL attest tx from the Attested event log.
    if (!/already attested/i.test(String(e.message))) throw e;
    txHash = await findAttestTx(sh);
    if (!txHash) throw e;
  }
  const ver = await backend.verify(attestation).catch(() => null);
  return {
    sealedAt: new Date().toISOString(),
    verdict, scoreHash: sh, attestationHash: ah, txHash,
    registry: REGISTRY_ADDR, rubricHash: RUBRIC_HASH,
    teeVerified: ver?.teeVerified ?? null, model: ver?.model ?? null,
    explorerTx: `${EXPLORER}/tx/${txHash}`,
  };
}
