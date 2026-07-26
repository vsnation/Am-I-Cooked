// Offline tests: registry contract + full autopsy shape with a mocked gateway and a
// tiny incident registry. Live data-path validation runs separately
// (apps/web/lib/validate.js, needs GRAPH_API_KEY).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REGISTRY, gql, autopsy, lendingSurface, dexSurface,
  loadIncidents, incidentSurface, cookedScore,
} from "../src/autopsy.js";

const TEST_INCIDENTS = {
  incidents: [
    { target: "Mock Lending", date: "Jan 2024", lostUSD: 1_000_000, type: "Lending",
      recovered: "gone", matchKeys: ["mock lending", "mock weth"] },
    { target: "Harvest-ish", date: "Oct 2020", lostUSD: 24_000_000, type: "Yield",
      recovered: "partial", matchKeys: ["harvestish"] },
  ],
};

test("registry: every source has name/chain/schema/id", () => {
  assert.ok(REGISTRY.length >= 4);
  for (const s of REGISTRY) {
    assert.match(s.name, /\w/);
    assert.equal(s.chain, "mainnet");
    assert.ok(["messari-lending", "uniswap-v3"].includes(s.schema));
    assert.match(s.id, /^[A-Za-z0-9]{40,}$/);
  }
});

test("registry: ≥2 standardized lending sources (track requirement)", () => {
  assert.ok(REGISTRY.filter(s => s.schema === "messari-lending").length >= 2);
});

test("incidentSurface: throws until loadIncidents is called", () => {
  assert.throws(() => incidentSurface(["weth"]), /incidents registry not loaded/);
});

const FIXTURES = {
  "messari-lending": {
    protocols: [{ name: "Mock Lending", totalValueLockedUSD: "1000000" }],
    account: {
      positionCount: 2, openPositionCount: 1,
      positions: [{ side: "COLLATERAL", balance: "5", market: { name: "Mock WETH", inputToken: { symbol: "WETH", decimals: 18 }, totalValueLockedUSD: "900000" } }],
    },
  },
  "uniswap-v3": {
    factories: [{ totalVolumeUSD: "42" }],
    positions: [{ liquidity: "777", pool: { token0: { symbol: "USDC" }, token1: { symbol: "WETH" }, totalValueLockedUSD: "5" } }],
    swaps: [{ timestamp: "1700000000", amountUSD: "123.4", token0: { symbol: "USDC" }, token1: { symbol: "WETH" } }],
  },
};

function mockGateway() {
  const real = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    const id = String(url).split("/subgraphs/id/")[1];
    const schema = REGISTRY.find(s => s.id === id)?.schema;
    return { ok: true, status: 200, json: async () => ({ data: FIXTURES[schema] }) };
  };
  return { calls, restore: () => { globalThis.fetch = real; } };
}

test("autopsy: full report shape against mocked gateway + test incidents", async () => {
  loadIncidents(TEST_INCIDENTS);
  const m = mockGateway();
  try {
    const r = await autopsy("test-key", "0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045");
    assert.equal(r.surfaces.lending.length, REGISTRY.filter(s => s.schema === "messari-lending").length);
    for (const l of r.surfaces.lending) {
      assert.equal(l.protocolTvlUSD, 1000000);
      assert.deepEqual(l.openPositions[0], { side: "COLLATERAL", balance: "5", market: "Mock WETH", token: "WETH" });
    }
    assert.deepEqual(r.surfaces.dex.lpPositions, [{ pair: "USDC/WETH", liquidity: "777", poolTvlUSD: 5 }]);
    assert.deepEqual(r.surfaces.dex.recentSwaps, [{ ts: 1700000000, pair: "USDC/WETH", amountUSD: 123.4 }]);

    // "Mock WETH" market matches the gone incident → exploit exposure + ghost items
    assert.equal(r.surfaces.incidents.matches.length, 1);
    assert.equal(r.surfaces.incidents.matches[0].target, "Mock Lending");
    assert.ok(r.surfaces.ghost.items.length >= 1);
    assert.equal(r.surfaces.approvals.status, "pending-feed");
    assert.equal(r.surfaces.behavioral.score, 0, "1 swap → not enough history");

    // partial cooked score is present, honest about pending feeds
    assert.equal(r.cooked.partial, true);
    assert.ok(r.cooked.pendingFeeds.includes("approvals(40%)"));
    assert.ok(r.cooked.score > 0 && r.cooked.score <= 100);
    assert.ok(typeof r.cooked.band === "string");

    // one gateway call per registry source
    assert.equal(m.calls.length, REGISTRY.length);
    assert.ok(m.calls.every(u => String(u).startsWith("https://gateway.thegraph.com/api/test-key/subgraphs/id/")));
  } finally { m.restore(); }
});

test("gql: proxy mode routes through proxyBase instead of the gateway", async () => {
  const real = globalThis.fetch;
  let seen;
  globalThis.fetch = async (url) => { seen = String(url); return { ok: true, status: 200, json: async () => ({ data: { ok: 1 } }) }; };
  try {
    await gql({ proxyBase: "https://example.com/cooked-api" }, "SubId", "query {}");
    assert.equal(seen, "https://example.com/cooked-api/subgraphs/id/SubId");
  } finally { globalThis.fetch = real; }
});

test("gql: surfaces subgraph errors as thrown Errors", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ errors: [{ message: "boom" }] }) });
  try {
    await assert.rejects(() => gql("k", "SomeId", "query {}"), /SomeId: boom/);
  } finally { globalThis.fetch = real; }
});

test("cookedScore: bands cover the range", () => {
  loadIncidents(TEST_INCIDENTS);
  const zero = cookedScore({ incidents: { matches: [] }, ghost: { score: 0 }, behavioral: { score: 0 } });
  assert.equal(zero.score, 0);
  assert.equal(zero.band, "RARE");
  const hot = cookedScore({ incidents: { matches: [1, 2, 3] }, ghost: { score: 100 }, behavioral: { score: 100 } });
  assert.equal(hot.score, 60);
  assert.equal(hot.band, "MEDIUM WELL");
});

test("surfaces are independently callable (skill can answer narrow questions)", async () => {
  const m = mockGateway();
  try {
    const lend = await lendingSurface("k", "0xabc0000000000000000000000000000000000abc");
    assert.ok(lend.every(l => l.positionCount === 2));
    const dex = await dexSurface("k", "0xabc0000000000000000000000000000000000abc");
    assert.equal(dex.source, "Uniswap v3 Ethereum");
  } finally { m.restore(); }
});

test("real incidents.json loads and matches a known incident", async () => {
  const { readFileSync } = await import("node:fs");
  const data = JSON.parse(readFileSync(new URL("../../../hacks/incidents.json", import.meta.url), "utf8"));
  loadIncidents(data);
  const s = incidentSurface(["harvest finance"]);
  assert.equal(s.registrySize, 176);
  assert.ok(s.matches.some(mt => mt.target === "Harvest Finance"));
});
