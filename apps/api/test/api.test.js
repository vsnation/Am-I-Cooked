// apps/api unit tests — pure logic plus approvalsSurface over a mocked JSON-RPC
// transport (no network). Run: node --test test/
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { latestPairs, approvalsSurface } from "../approvals.js";
import {
  loadIncidents, incidentSurface, ghostSurface, behavioralSurface, cookedScore,
} from "../autopsy.js";
import { buildRevoke, resolveAddress, CHAINS } from "../onchain.js";

// ---------- helpers ----------

const OWNER = "0x1111111111111111111111111111111111111111";
const TOKEN_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TOKEN_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const TOKEN_C = "0xcccccccccccccccccccccccccccccccccccccccc";
const SPENDER_X = "0x2222222222222222222222222222222222222222";
const PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3";

const pad32 = v => v.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const topicFor = addr => "0x" + pad32(addr);
const MAX_UINT = "0x" + "f".repeat(64);

function approvalLog(token, spender, { block, logIndex = 0, value = MAX_UINT }) {
  return {
    address: token,
    topics: [
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
      topicFor(OWNER),
      topicFor(spender),
    ],
    data: value,
    blockNumber: "0x" + block.toString(16),
    logIndex: "0x" + logIndex.toString(16),
  };
}

// ---------- latestPairs ----------

describe("latestPairs", () => {
  test("later block overwrites an earlier approval for the same pair", () => {
    const pairs = latestPairs([
      approvalLog(TOKEN_A, SPENDER_X, { block: 100, value: "0x" + pad32("0x64") }),
      approvalLog(TOKEN_A, SPENDER_X, { block: 200, value: MAX_UINT }),
    ]);
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0].approvedValue, BigInt(MAX_UINT));
    assert.equal(pairs[0].bn, 200);
  });

  test("same block: higher logIndex wins", () => {
    const pairs = latestPairs([
      approvalLog(TOKEN_A, SPENDER_X, { block: 100, logIndex: 5, value: MAX_UINT }),
      approvalLog(TOKEN_A, SPENDER_X, { block: 100, logIndex: 9, value: "0x" + pad32("0x0") }),
    ]);
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0].approvedValue, 0n);
  });

  test("distinct (token, spender) pairs are kept apart", () => {
    const pairs = latestPairs([
      approvalLog(TOKEN_A, SPENDER_X, { block: 100 }),
      approvalLog(TOKEN_B, SPENDER_X, { block: 100 }),
      approvalLog(TOKEN_A, PERMIT2, { block: 100 }),
    ]);
    assert.equal(pairs.length, 3);
  });

  test('empty "0x" data decodes as zero', () => {
    const pairs = latestPairs([
      approvalLog(TOKEN_A, SPENDER_X, { block: 100, value: "0x" }),
    ]);
    assert.equal(pairs[0].approvedValue, 0n);
  });

  test("spender is recovered from the indexed topic", () => {
    const pairs = latestPairs([approvalLog(TOKEN_A, SPENDER_X, { block: 100 })]);
    assert.equal(pairs[0].spender, SPENDER_X);
    assert.equal(pairs[0].token, TOKEN_A);
  });
});

// ---------- approvalsSurface over a mocked RPC ----------

describe("approvalsSurface (mocked JSON-RPC)", () => {
  const realFetch = globalThis.fetch;
  const TIP = 1_000_000;

  // token C was approved then revoked on-chain: log survives, allowance() says 0
  const LOGS = [
    approvalLog(TOKEN_A, SPENDER_X, { block: 900_000, value: MAX_UINT }),
    approvalLog(TOKEN_B, PERMIT2, { block: 950_000, value: MAX_UINT }),
    approvalLog(TOKEN_C, SPENDER_X, { block: 960_000, value: "0x" + pad32("0x64") }),
  ];
  const REVOKED = new Set([`${TOKEN_C}:${SPENDER_X}`]);

  beforeEach(() => {
    globalThis.fetch = async (url, { body }) => {
      const req = JSON.parse(body);
      const reply = obj => new Response(JSON.stringify(obj), { status: 200 });
      if (Array.isArray(req)) {
        return reply(req.map(({ id, params: [call] }) => {
          const sel = call.data.slice(0, 10);
          if (sel === "0xdd62ed3e") {
            const spender = "0x" + call.data.slice(10 + 64 + 24);
            const revoked = REVOKED.has(`${call.to}:${spender}`);
            return { jsonrpc: "2.0", id, result: revoked ? "0x" + pad32("0x0") : MAX_UINT };
          }
          if (sel === "0x95d89b41") { // symbol() — 3-char "TST"
            return { jsonrpc: "2.0", id, result: "0x" + pad32("0x20") + pad32("0x3") + "545354" + "0".repeat(58) };
          }
          if (sel === "0x313ce567") return { jsonrpc: "2.0", id, result: "0x" + pad32("0x6") };
          return { jsonrpc: "2.0", id, result: "0x" };
        }));
      }
      if (req.method === "eth_blockNumber") return reply({ jsonrpc: "2.0", id: 1, result: "0x" + TIP.toString(16) });
      if (req.method === "eth_getLogs") return reply({ jsonrpc: "2.0", id: 1, result: LOGS });
      throw new Error(`unexpected method ${req.method}`);
    };
  });
  afterEach(() => { globalThis.fetch = realFetch; });

  test("revoked pairs are healed, open wounds classified and scored", async () => {
    const surface = await approvalsSurface("http://mock", OWNER, { addresses: [] });
    assert.equal(surface.tipBlock, TIP);
    assert.equal(surface.totalApprovalEvents, 3);
    assert.equal(surface.pairsSeen, 3);
    assert.equal(surface.healedCount, 1); // token C: live allowance() said 0
    assert.equal(surface.openCount, 2);
    assert.equal(surface.unlimitedCount, 2);

    const unknown = surface.wounds.find(w => w.token === TOKEN_A);
    const permit2 = surface.wounds.find(w => w.token === TOKEN_B);
    assert.equal(unknown.risk, "high"); // unlimited to an unrecognized contract
    assert.equal(unknown.spenderLabel, null);
    assert.equal(permit2.risk, "medium"); // unlimited but battle-tested spender
    assert.equal(permit2.spenderLabel, "Permit2");
    assert.equal(surface.wounds[0].risk, "high"); // sorted most severe first
    assert.equal(surface.score, 18 + 8);

    assert.equal(unknown.symbol, "TST"); // metadata decoded from mocked symbol()
    assert.equal(unknown.decimals, 6);
    assert.equal(permit2.allowance, "unlimited");
  });

  test("a drainer spender from the incident registry makes the wound critical", async () => {
    const incidents = { addresses: [{ address: SPENDER_X, kind: "drainer", target: "SomeRug" }] };
    const surface = await approvalsSurface("http://mock", OWNER, incidents);
    const hit = surface.wounds.find(w => w.spender === SPENDER_X);
    assert.equal(hit.risk, "critical");
    assert.deepEqual(hit.incident, { target: "SomeRug", kind: "drainer" });
    assert.ok(surface.score >= 70); // any critical wound floors the score at 70
  });
});

// ---------- autopsy pure surfaces ----------

const TEST_REGISTRY = {
  incidents: [
    { target: "Ronin Bridge", date: "2022-03-23", lostUSD: 624_000_000, type: "bridge hack",
      recovered: "partial", matchKeys: ["ronin", "axie"] },
    { target: "Terra/LUNA", date: "2022-05-09", lostUSD: 40_000_000_000, type: "collapse",
      recovered: "gone", matchKeys: ["luna", "ust", "terra"] },
    { target: "FTX", date: "2022-11-11", lostUSD: 8_000_000_000, type: "fraud",
      recovered: "gone", matchKeys: ["ftt"] },
  ],
  addresses: [],
};

describe("incidentSurface", () => {
  test("matches the universe against the registry and sums losses", () => {
    loadIncidents(TEST_REGISTRY);
    const out = incidentSurface(["LUNA", "USDC", "WETH"]);
    assert.equal(out.matches.length, 1);
    assert.equal(out.matches[0].target, "Terra/LUNA");
    assert.equal(out.incidentLossUSD, 40_000_000_000);
  });

  test("short keys need an exact match — no substring false positives", () => {
    loadIncidents(TEST_REGISTRY);
    // "ftt" (3 chars) must not fire on a term merely containing it
    assert.equal(incidentSurface(["shiftt"]).matches.length, 0);
    assert.equal(incidentSurface(["ftt"]).matches.length, 1);
  });

  test("throws when the registry was never loaded", () => {
    loadIncidents(null);
    assert.throws(() => incidentSurface(["luna"]), /registry not loaded/);
    loadIncidents(TEST_REGISTRY);
  });
});

describe("ghostSurface", () => {
  test("flags LPs in dead pools and positions in never-recovered protocols", () => {
    loadIncidents(TEST_REGISTRY);
    const dex = {
      lpPositions: [
        { pair: "WETH/USDC", liquidity: "5", poolTvlUSD: 3_000 },   // dead pool
        { pair: "LUNA/UST", liquidity: "9", poolTvlUSD: 50_000 },   // dead protocol
        { pair: "WETH/USDT", liquidity: "0", poolTvlUSD: 1 },       // no liquidity — skip
      ],
      recentSwaps: [],
    };
    const lending = [{ source: "Aave v3", openPositions: [{ market: "Terra Anchor", token: "UST" }] }];
    const out = ghostSurface(lending, dex);
    assert.equal(out.items.length, 3);
    assert.equal(out.score, 100); // 3 * 45 capped at 100
  });

  test("healthy portfolio produces no ghosts", () => {
    loadIncidents(TEST_REGISTRY);
    const out = ghostSurface(
      [{ source: "Aave v3", openPositions: [{ market: "Aave WETH", token: "WETH" }] }],
      { lpPositions: [{ pair: "WETH/USDC", liquidity: "5", poolTvlUSD: 9_000_000 }], recentSwaps: [] },
    );
    assert.deepEqual(out, { items: [], score: 0 });
  });
});

describe("behavioralSurface", () => {
  test("fewer than 3 swaps → no verdict", () => {
    const out = behavioralSurface({ recentSwaps: [{ ts: 1, amountUSD: 10, pair: "A/B" }], lpPositions: [] });
    assert.equal(out.worstDay, null);
    assert.equal(out.score, 0);
  });

  test("finds the worst day and scores the outlier ratio", () => {
    const day = 86_400;
    const out = behavioralSurface({
      lpPositions: [],
      recentSwaps: [
        { ts: 1 * day, amountUSD: 100, pair: "WETH/USDC" },
        { ts: 2 * day, amountUSD: 100, pair: "WETH/USDC" },
        { ts: 3 * day, amountUSD: 5_000, pair: "LUNA/UST" }, // 50x the median
      ],
    });
    assert.equal(out.worstDay.biggestSwapUSD, 5_000);
    assert.equal(out.worstDay.pair, "LUNA/UST");
    assert.equal(out.score, 100); // ratio 50 * 4 capped
  });
});

describe("cookedScore", () => {
  const base = { incidents: { matches: [] }, ghost: { score: 0 }, behavioral: { score: 0 } };

  test("no approvals feed → partial score, pending feed named", () => {
    const out = cookedScore({ ...base, approvals: { status: "pending-feed" } });
    assert.equal(out.partial, true);
    assert.deepEqual(out.pendingFeeds, ["approvals(40%)"]);
    assert.equal(out.score, 0);
    assert.equal(out.band, "RARE");
  });

  test("weights: wounds .40 · exploit .25 · ghost .20 · behavioral .15", () => {
    const out = cookedScore({
      incidents: { matches: [{}, {}] },      // exploit = min(100, 2*34) = 68
      ghost: { score: 50 },
      behavioral: { score: 40 },
      approvals: { score: 80 },
    });
    assert.equal(out.partial, false);
    assert.equal(out.score, Math.round(80 * 0.40 + 68 * 0.25 + 50 * 0.20 + 40 * 0.15));
    assert.deepEqual(out.components,
      { openWounds: 80, exploitExposure: 68, ghostPortfolio: 50, behavioral: 40 });
  });

  test("bands cover the whole scale", () => {
    const at = score => cookedScore({ ...base,
      approvals: { score: 0 },
      ghost: { score: score * 5 } }).band; // ghost weight .20 → score*5 lands exactly on `score`
    assert.equal(at(10), "RARE");
    assert.equal(at(30), "MEDIUM RARE");
    assert.equal(at(50), "MEDIUM WELL");
    assert.equal(at(70), "COOKED");
    assert.equal(at(90), "CHARCOAL");
  });
});

// ---------- onchain ----------

describe("buildRevoke", () => {
  test("encodes approve(spender, 0) with a checksummed target", () => {
    const tx = buildRevoke(1, TOKEN_A, SPENDER_X);
    assert.equal(tx.chainId, 1);
    assert.equal(tx.to.toLowerCase(), TOKEN_A);
    assert.notEqual(tx.to, TOKEN_A); // checksummed, not raw lowercase
    assert.equal(tx.value, "0x0");
    assert.equal(tx.data, "0x095ea7b3" + pad32(SPENDER_X) + "0".repeat(64));
  });
});

describe("resolveAddress", () => {
  test("checksums a plain 0x address without touching the network", async () => {
    const out = await resolveAddress("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
    assert.equal(out, "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  });

  test("rejects input that is neither an address nor an ENS name", async () => {
    await assert.rejects(resolveAddress("not-an-address"), /0x… address or an ENS name/);
    await assert.rejects(resolveAddress(""), /0x… address or an ENS name/);
    await assert.rejects(resolveAddress("0x1234"), /0x… address or an ENS name/);
  });
});

describe("CHAINS registry", () => {
  test("all chains: unique ids, https RPCs, explorers, per-chain block time", () => {
    assert.ok(CHAINS.length >= 7, "core seven chains always present");
    assert.equal(new Set(CHAINS.map(c => c.id)).size, CHAINS.length);
    for (const c of CHAINS) {
      assert.match(c.rpc, /^https:\/\//);
      assert.match(c.explorer, /^https:\/\//);
      assert.ok(c.lookback > 0);
      assert.ok(c.blockSeconds > 0, `${c.name} needs blockSeconds for honest age estimates`);
    }
  });
});
