// Judge tests: rubric math, prompt construction, verdict validation, hash stability.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RUBRIC_WEIGHTS, band, buildJudgePrompt, computeComponents, computeScore,
  parseVerdict, canonicalize, scoreHash, attestationHash, RUBRIC_VERSION,
} from "../src/judge.js";

const SURFACES = {
  incidents: { matches: [{ target: "A" }, { target: "B" }] },   // 68
  ghost: { items: [{}], score: 45 },                             // 45
  behavioral: { score: 12 },
  approvals: { status: "pending-feed" },
};

const verdictFor = (surfaces, address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045") => {
  const { components, pendingFeeds } = computeComponents(surfaces);
  const score = computeScore(components);
  return {
    rubricVersion: RUBRIC_VERSION, address, score, band: band(score),
    partial: pendingFeeds.length > 0, pendingFeeds, components,
    evidence: [], roast: "ok",
  };
};

test("weights sum to 1.0 and match the frozen rubric split 40/25/20/15", () => {
  assert.equal(Object.values(RUBRIC_WEIGHTS).reduce((a, b) => a + b, 0), 1);
  assert.deepEqual(RUBRIC_WEIGHTS, { wounds: 0.40, exploitExposure: 0.25, ghostPortfolio: 0.20, behavioral: 0.15 });
});

test("component math mirrors the rubric formulas", () => {
  const { components, pendingFeeds } = computeComponents(SURFACES);
  assert.deepEqual(components, { wounds: 0, exploitExposure: 68, ghostPortfolio: 45, behavioral: 12 });
  assert.deepEqual(pendingFeeds, ["approvals(40%)"]);
  assert.equal(computeScore(components), Math.round(68 * 0.25 + 45 * 0.20 + 12 * 0.15)); // 28
});

test("wounds reads the live multichain approvals shape (items + incident/unlimited flags)", () => {
  // Shape emitted by apps/api/onchain.js multichainApprovals(): items[], score, counts{}.
  const live = computeComponents({ ...SURFACES, approvals: {
    items: [
      { spender: "0x1", incident: { target: "Harvest Finance", kind: "exploiter" }, unlimited: true, risk: "critical" },
      { spender: "0x2", incident: null, unlimited: true, risk: "high" },
      { spender: "0x3", incident: null, unlimited: true, risk: "medium" },
      { spender: "0x4", incident: null, unlimited: false, risk: "low" },
    ],
    score: 84,
    counts: { total: 4, critical: 1, unlimited: 3 },
  } });
  // Engine-identical formula: min(100, max(70-if-critical, 55×1 + 18×1 + 8×1 + 3×1)) = 84.
  assert.equal(live.components.wounds, 84);
  assert.deepEqual(live.pendingFeeds, []);
});

test("wounds reads the single-chain approvalsSurface shape (wounds[])", () => {
  const live = computeComponents({ ...SURFACES, approvals: {
    wounds: [
      { spender: "0xa", incident: null, unlimited: true, risk: "high" },
      { spender: "0xb", incident: null, unlimited: true, risk: "high" },
    ],
    openCount: 2, unlimitedCount: 2,
  } });
  assert.equal(live.components.wounds, 36); // 18×2, no critical floor
  assert.deepEqual(live.pendingFeeds, []);
});

test("a single critical wound triggers the 70 floor", () => {
  const live = computeComponents({ ...SURFACES, approvals: {
    items: [{ spender: "0x1", incident: { target: "Ronin", kind: "exploiter" }, unlimited: false, risk: "critical" }],
    counts: { total: 1, critical: 1, unlimited: 0 },
  } });
  assert.equal(live.components.wounds, 70); // max(70, 55×1)
});

test("unavailable approvals feed scores 0 and forces pendingFeeds (missing-surface rule)", () => {
  for (const approvals of [
    { status: "unavailable", error: "rpc down" },
    { status: "pending-feed" },
    { items: [], score: 0, chainsScanned: 0, skipped: ["Ethereum", "Base"], counts: { total: 0, critical: 0, unlimited: 0 } },
    undefined,
  ]) {
    const r = computeComponents({ ...SURFACES, approvals });
    assert.equal(r.components.wounds, 0);
    assert.deepEqual(r.pendingFeeds, ["approvals(40%)"]);
  }
});

test("bands cover the range at the documented cut points", () => {
  assert.equal(band(0), "RARE");
  assert.equal(band(21), "MEDIUM RARE");
  assert.equal(band(41), "MEDIUM WELL");
  assert.equal(band(61), "COOKED");
  assert.equal(band(81), "CHARCOAL");
});

test("prompt embeds the rubric verbatim and the surfaces JSON", () => {
  const p = buildJudgePrompt("RUBRIC-TEXT-SENTINEL", { address: "0xabc", surfaces: SURFACES });
  assert.ok(p.includes("RUBRIC-TEXT-SENTINEL"));
  assert.ok(p.includes('"matches":[{"target":"A"}'));
  assert.ok(p.includes("Return ONLY the JSON object"));
});

test("parseVerdict accepts a rubric-conforming verdict wrapped in prose", () => {
  const v = verdictFor(SURFACES);
  const parsed = parseVerdict(`Here is my verdict:\n\`\`\`json\n${JSON.stringify(v)}\n\`\`\`\ndone`);
  assert.deepEqual(parsed, v);
});

test("parseVerdict rejects tampered scores, bands and off-rubric math", () => {
  const v = verdictFor(SURFACES);
  assert.throws(() => parseVerdict(JSON.stringify({ ...v, score: 99 })), /band|weights/);
  assert.throws(() => parseVerdict(JSON.stringify({ ...v, band: "CHARCOAL" })), /band/);
  assert.throws(() => parseVerdict(JSON.stringify({ ...v, components: { ...v.components, ghostPortfolio: 100 } })), /weights/);
  assert.throws(() => parseVerdict("no json here"), /no JSON/);
  // Out-of-range scores are rubric violations, never TypeErrors (band() is total).
  assert.throws(() => parseVerdict(JSON.stringify({ ...v, score: 120, band: "CHARCOAL" })), /violates rubric/);
  assert.throws(() => parseVerdict(JSON.stringify({ ...v, score: -3 })), /violates rubric/);
});

test("canonicalize is key-order independent → stable scoreHash", () => {
  const a = { b: 1, a: [{ y: 2, x: 3 }] };
  const b = { a: [{ x: 3, y: 2 }], b: 1 };
  assert.equal(canonicalize(a), canonicalize(b));
  const v = verdictFor(SURFACES);
  const shuffled = JSON.parse(JSON.stringify(v));
  assert.equal(scoreHash(v), scoreHash(shuffled));
  assert.match(scoreHash(v), /^0x[0-9a-f]{64}$/);
  assert.match(attestationHash("att1-x"), /^0x[0-9a-f]{64}$/);
});

test("keccak256 known vector (empty input) — js-sha3 wired correctly", () => {
  assert.equal(attestationHash(""), "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
});
