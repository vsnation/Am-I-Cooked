// Offline tests: registry contract + full autopsy shape with a mocked gateway.
// Live data-path validation runs separately (apps/web/lib/validate.js, needs GRAPH_API_KEY).
import { test } from "node:test";
import assert from "node:assert/strict";
import { REGISTRY, gql, autopsy, lendingSurface, dexSurface } from "../src/autopsy.js";

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
  globalThis.fetch = async (url, opts) => {
    calls.push(url);
    const id = String(url).split("/subgraphs/id/")[1];
    const schema = REGISTRY.find(s => s.id === id)?.schema;
    return { json: async () => ({ data: FIXTURES[schema] }) };
  };
  return { calls, restore: () => { globalThis.fetch = real; } };
}

test("autopsy: full report shape against mocked gateway", async () => {
  const m = mockGateway();
  try {
    const r = await autopsy("test-key", "0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045");
    assert.equal(r.surfaces.lending.length, REGISTRY.filter(s => s.schema === "messari-lending").length);
    for (const l of r.surfaces.lending) {
      assert.equal(l.protocolTvlUSD, 1000000);
      assert.deepEqual(l.openPositions[0], { side: "COLLATERAL", balance: "5", market: "Mock WETH", token: "WETH" });
    }
    assert.deepEqual(r.surfaces.dex.lpPositions, [{ pair: "USDC/WETH", liquidity: "777" }]);
    assert.deepEqual(r.surfaces.dex.recentSwaps, [{ ts: 1700000000, pair: "USDC/WETH", amountUSD: 123.4 }]);
    assert.equal(r.surfaces.approvals.status, "pending-feed");
    // one gateway call per registry source, address lowercased into query vars
    assert.equal(m.calls.length, REGISTRY.length);
    assert.ok(m.calls.every(u => String(u).startsWith("https://gateway.thegraph.com/api/test-key/subgraphs/id/")));
  } finally { m.restore(); }
});

test("gql: surfaces subgraph errors as thrown Errors", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async () => ({ json: async () => ({ errors: [{ message: "boom" }] }) });
  try {
    await assert.rejects(() => gql("k", "SomeId", "query {}"), /SomeId: boom/);
  } finally { globalThis.fetch = real; }
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
