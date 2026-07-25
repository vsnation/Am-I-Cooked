// Sealed judge — builds the prompt that goes through seal.infer (0G Compute TEE),
// parses the verdict, and produces the two bytes32 values CookedRegistry.attest()
// anchors on-chain: scoreHash (canonical verdict JSON) and attestationHash.
// The rubric text itself lives in contracts/rubric.md; its keccak256 is the
// registry's immutable rubricHash (scripts/rubric-hash.js prints it for deploy).
import { keccak256 } from "js-sha3";

export const RUBRIC_VERSION = "v1";
export const RUBRIC_WEIGHTS = { wounds: 0.40, exploitExposure: 0.25, ghostPortfolio: 0.20, behavioral: 0.15 };
export const BANDS = [[20, "RARE"], [40, "MEDIUM RARE"], [60, "MEDIUM WELL"], [80, "COOKED"], [100, "CHARCOAL"]];
export const band = (score) => BANDS.find(([max]) => score <= max)[1];

/** The exact prompt sent through seal.infer. rubricText MUST be the deployed
 *  contracts/rubric.md content — the same bytes the registry's rubricHash commits to. */
export function buildJudgePrompt(rubricText, report) {
  return [
    "You are the sealed judge for AM I COOKED?. You run inside a TEE; your output is",
    "hashed and anchored on-chain against the rubric hash below your control.",
    "Apply the RUBRIC exactly as written — its weights and component formulas are law.",
    "Score the wallet from the SURFACES JSON. A missing or pending-feed surface scores 0,",
    "goes into pendingFeeds, and sets partial=true; never renormalize weights.",
    "Return ONLY the JSON object the rubric's Output section specifies — no markdown,",
    "no commentary, no code fences.",
    "",
    "=== RUBRIC ===",
    rubricText,
    "=== SURFACES ===",
    JSON.stringify({ address: report.address, surfaces: report.surfaces }),
    "=== VERDICT JSON ===",
  ].join("\n");
}

/** Reference implementation of the rubric's component math (mirrors rubric.md §Components).
 *  Used by tests and the demo judge; the TEE model must land on the same numbers. */
export function computeComponents(surfaces) {
  const pending = [];
  let wounds = 0;
  const a = surfaces.approvals;
  // A feed that is absent, not yet wired, down, or that scanned zero chains scores 0
  // and marks the verdict partial (rubric §Missing-surface rule) — never a silent
  // full-confidence 0.
  if (!a || a.status === "pending-feed" || a.status === "unavailable" || a.chainsScanned === 0) {
    pending.push("approvals(40%)");
  } else {
    // Live shapes: multichain surface carries `items`, single-chain carries `wounds`.
    // Rubric formula over the feed-assigned risk tiers — identical to the engine
    // (approvals.js / onchain.js), so the judge reproduces the surface's own score.
    const woundsList = a.items ?? a.wounds ?? [];
    const n = r => woundsList.filter(w => w?.risk === r).length;
    wounds = Math.min(100, Math.max(
      n("critical") > 0 ? 70 : 0,
      n("critical") * 55 + n("high") * 18 + n("medium") * 8 + n("low") * 3,
    ));
  }
  const exploitExposure = Math.min(100, (surfaces.incidents?.matches?.length ?? 0) * 34);
  const ghostPortfolio = Math.min(100, (surfaces.ghost?.items?.length ?? 0) * 45);
  const behavioral = surfaces.behavioral?.score ?? 0;
  return { components: { wounds, exploitExposure, ghostPortfolio, behavioral }, pendingFeeds: pending };
}

export function computeScore(components) {
  return Math.round(
    components.wounds * RUBRIC_WEIGHTS.wounds
    + components.exploitExposure * RUBRIC_WEIGHTS.exploitExposure
    + components.ghostPortfolio * RUBRIC_WEIGHTS.ghostPortfolio
    + components.behavioral * RUBRIC_WEIGHTS.behavioral,
  );
}

/** Extract and validate the verdict object from raw model output. Tolerates stray
 *  prose/fences around the JSON but rejects anything structurally off-rubric. */
export function parseVerdict(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("judge output contains no JSON object");
  const v = JSON.parse(text.slice(start, end + 1));
  const problems = [];
  if (v.rubricVersion !== RUBRIC_VERSION) problems.push(`rubricVersion ${v.rubricVersion}`);
  if (!/^0x[0-9a-fA-F]{40}$/.test(v.address ?? "")) problems.push("address");
  if (!Number.isInteger(v.score) || v.score < 0 || v.score > 100) problems.push("score");
  for (const k of Object.keys(RUBRIC_WEIGHTS)) {
    const c = v.components?.[k];
    if (!Number.isInteger(c) || c < 0 || c > 100) problems.push(`components.${k}`);
  }
  if (typeof v.partial !== "boolean" || !Array.isArray(v.pendingFeeds)) problems.push("partial/pendingFeeds");
  if (typeof v.roast !== "string" || v.roast.length > 140) problems.push("roast");
  if (v.band !== band(v.score)) problems.push(`band ${v.band} vs score ${v.score}`);
  if (computeScore(v.components) !== v.score) problems.push("score does not follow rubric weights");
  if (problems.length) throw new Error(`verdict violates rubric: ${problems.join(", ")}`);
  return v;
}

/** Canonical JSON: sorted keys at every level — the byte-stable form both the share
 *  card and the verification page hash. */
export function canonicalize(obj) {
  if (Array.isArray(obj)) return `[${obj.map(canonicalize).join(",")}]`;
  if (obj && typeof obj === "object") {
    return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(obj);
}

export const keccakHex = (s) => `0x${keccak256(s)}`;
/** bytes32 for CookedRegistry.attest(scoreHash, …) */
export const scoreHash = (verdict) => keccakHex(canonicalize(verdict));
/** bytes32 for CookedRegistry.attest(…, attestationHash) */
export const attestationHash = (attestation) => keccakHex(attestation);
