// End-to-end sealed-judge flow against the reference judge (labeled stub — the live
// path swaps referenceInfer for the seal_infer MCP tool once 0G Compute lands, t4):
// autopsy report → buildJudgePrompt → infer → parseVerdict → scoreHash/attestationHash
// → the exact CookedRegistry.attest() payload. Attestation uses seal's att1 format,
// so seal_verify validates it unchanged.
// Usage: node scripts/judge-demo.js
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  buildJudgePrompt, computeComponents, computeScore, band, parseVerdict,
  scoreHash, attestationHash, RUBRIC_VERSION,
} from "../src/judge.js";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const rubric = readFileSync(new URL("../../../contracts/rubric.md", import.meta.url), "utf8");

// A wallet that touched an exploited protocol and holds a dead LP — mock surfaces in
// the exact shape cooked-skill's autopsy() emits.
const report = {
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  surfaces: {
    lending: [{ source: "Aave v3 Ethereum", openPositions: [{ side: "COLLATERAL", market: "Harvest WETH", token: "WETH" }] }],
    dex: { lpPositions: [{ pair: "FARM/WETH", liquidity: "9", poolTvlUSD: 812 }], recentSwaps: [] },
    incidents: { matches: [{ target: "Harvest Finance", lostUSD: 24000000 }] },
    ghost: { items: [{ where: "LP FARM/WETH", why: "pool TVL $812 — effectively dead" }], score: 45 },
    behavioral: { score: 0, note: "not enough swap history" },
    approvals: { status: "pending-feed" },
  },
};

// Reference judge standing in for the TEE model: same interface as seal.infer,
// same att1 attestation scheme as packages/seal StubBackend.
function referenceInfer(prompt) {
  const { components, pendingFeeds } = computeComponents(report.surfaces);
  const score = computeScore(components);
  const verdict = {
    rubricVersion: RUBRIC_VERSION, address: report.address, score, band: band(score),
    partial: pendingFeeds.length > 0, pendingFeeds, components,
    evidence: [
      "1 incident-registry match: Harvest Finance ($24M lost)",
      "1 ghost item: LP FARM/WETH in a $812 pool",
    ],
    roast: "Collateral in a protocol that died in 2020 and an LP nobody visits — this wallet is a museum.",
  };
  const output = JSON.stringify(verdict);
  const model = "stub/deepseek-r1-tee", ts = Date.now();
  const body = `${model}|${ts}|${sha(prompt + output)}`;
  return { output, attestation: `att1-${body}-${sha(body).slice(0, 16)}` };
}

const prompt = buildJudgePrompt(rubric, report);
const { output, attestation } = referenceInfer(prompt);
const verdict = parseVerdict(output);

console.log(`prompt          ${prompt.length} chars (rubric ${rubric.length} + surfaces)`);
console.log(`verdict         ${verdict.score}/100 ${verdict.band} · partial=${verdict.partial} pending=${verdict.pendingFeeds.join(",")}`);
console.log(`components      ${JSON.stringify(verdict.components)}`);
console.log(`roast           ${verdict.roast}`);
console.log(`scoreHash       ${scoreHash(verdict)}`);
console.log(`attestationHash ${attestationHash(attestation)}`);
console.log(`→ CookedRegistry.attest(scoreHash, attestationHash) — payload ready`);
