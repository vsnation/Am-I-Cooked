// autopsy — cross-protocol wallet risk profile as a LIBRARY (zero dependencies).
// Built on The Graph gateway. Lending coverage uses Messari standardized schemas:
// ONE query shape covers every conforming market — that is why a 10-second autopsy
// is feasible. Designed for extraction as a standalone skill package.

import { readFileSync } from "node:fs";

const GATEWAY = "https://gateway.thegraph.com/api";
const INCIDENTS = JSON.parse(readFileSync(new URL("../../../hacks/incidents.json", import.meta.url), "utf8"));

/** Subgraph registry. `schema` names the query dialect a source conforms to —
 *  adding a lending protocol that follows the Messari standard is one line here. */
export const REGISTRY = [
  { name: "Aave v3 Ethereum", chain: "mainnet", schema: "messari-lending",
    id: "JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk" },
  { name: "Compound v3 Ethereum", chain: "mainnet", schema: "messari-lending",
    id: "AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9" },
  { name: "Spark Lend Ethereum", chain: "mainnet", schema: "messari-lending",
    id: "GbKdmBe4ycCYCQLQSjqGg6UHYoYfbyJyq5WrG35pv1si" },
  { name: "Uniswap v3 Ethereum", chain: "mainnet", schema: "uniswap-v3",
    id: "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV" },
];

export async function gql(apiKey, subgraphId, query, variables = {}) {
  const r = await fetch(`${GATEWAY}/${apiKey}/subgraphs/id/${subgraphId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const out = await r.json();
  if (out.errors) throw new Error(`subgraph ${subgraphId}: ${out.errors[0].message}`);
  return out.data;
}

const MESSARI_ACCOUNT = `query($id: ID!) {
  protocols(first: 1) { name totalValueLockedUSD }
  account(id: $id) {
    positionCount
    openPositionCount
    positions(first: 50) {
      side
      balance
      market { name inputToken { symbol decimals } totalValueLockedUSD }
    }
  }
}`;

const UNI_ACCOUNT = `query($addr: Bytes!) {
  factories(first: 1) { totalVolumeUSD }
  positions(first: 25, where: { owner: $addr }) {
    liquidity
    pool { token0 { symbol } token1 { symbol } totalValueLockedUSD }
  }
  swaps(first: 100, orderBy: timestamp, orderDirection: desc, where: { origin: $addr }) {
    timestamp amountUSD token0 { symbol } token1 { symbol }
  }
}`;

/** Lending surface: one standardized query per conforming source. */
export async function lendingSurface(apiKey, address) {
  const addr = address.toLowerCase();
  const sources = REGISTRY.filter(s => s.schema === "messari-lending");
  const results = await Promise.all(sources.map(async src => {
    const d = await gql(apiKey, src.id, MESSARI_ACCOUNT, { id: addr });
    return {
      source: src.name,
      protocolTvlUSD: Number(d.protocols?.[0]?.totalValueLockedUSD ?? 0),
      positionCount: d.account?.positionCount ?? 0,
      openPositions: (d.account?.positions ?? []).map(p => ({
        side: p.side, balance: p.balance, market: p.market?.name,
        token: p.market?.inputToken?.symbol,
      })),
    };
  }));
  return results;
}

/** DEX surface: LP positions + recent swap flow. */
export async function dexSurface(apiKey, address) {
  const addr = address.toLowerCase();
  const src = REGISTRY.find(s => s.schema === "uniswap-v3");
  const d = await gql(apiKey, src.id, UNI_ACCOUNT, { addr });
  return {
    source: src.name,
    lpPositions: (d.positions ?? []).map(p => ({
      pair: `${p.pool.token0.symbol}/${p.pool.token1.symbol}`, liquidity: p.liquidity,
    })),
    recentSwaps: (d.swaps ?? []).map(s => ({
      ts: Number(s.timestamp), pair: `${s.token0.symbol}/${s.token1.symbol}`,
      amountUSD: Number(s.amountUSD),
    })),
  };
}

/** Exploit-exposure surface: cross-reference the wallet's observed on-chain universe
 *  (lending markets, LP pools, traded tokens) against the curated incident registry
 *  (hacks/incidents.json). Name/symbol-level matching; address-level matching arrives
 *  with the approvals feed. */
export function incidentSurface(universe) {
  const terms = [...new Set(universe.map(t => t.toLowerCase()).filter(Boolean))];
  const matches = [];
  for (const inc of INCIDENTS.incidents) {
    const hit = terms.find(term =>
      inc.matchKeys.some(k => k === term || (k.length >= 5 && term.includes(k)) || (term.length >= 5 && k.includes(term))));
    if (hit) matches.push({ target: inc.target, date: inc.date, lostUSD: inc.lostUSD, type: inc.type, recovered: inc.recovered, matchedOn: hit });
  }
  return {
    method: "name/symbol cross-reference vs curated registry (176 incidents, address-level matching pending approvals feed)",
    registrySize: INCIDENTS.incidents.length,
    matches,
    incidentLossUSD: matches.reduce((a, m) => a + m.lostUSD, 0),
  };
}

/** Partial cooked score. Transparent formula, final weights live in the sealed judge:
 *  open wounds 40 (pending approvals feed) · exploit exposure 25 · ghost 20 (pending) ·
 *  behavioral 15 (pending). Until the other feeds land, only exploit exposure scores —
 *  reported as partial, never presented as the full verdict. */
export function cookedScore(surfaces) {
  const nHits = surfaces.incidents.matches.length;
  const exploit = Math.min(100, nHits * 34);            // 3+ brushes with disaster = maxed component
  const score = Math.round(exploit * 0.25);             // remaining 75% of weight awaits its feeds
  const bands = [[20, "RARE"], [40, "MEDIUM RARE"], [60, "MEDIUM WELL"], [80, "COOKED"], [100, "CHARCOAL"]];
  return {
    partial: true,
    pendingFeeds: ["approvals(40%)", "ghost(20%)", "behavioral(15%)"],
    components: { exploitExposure: exploit },
    score,
    band: bands.find(([max]) => score <= max)[1],
  };
}

/** Full autopsy: the four risk surfaces (two live, two pending their feeds). */
export async function autopsy(apiKey, address) {
  const [lending, dex] = await Promise.all([
    lendingSurface(apiKey, address),
    dexSurface(apiKey, address),
  ]);
  const universe = [
    ...lending.flatMap(l => l.openPositions.flatMap(p => [p.market, p.token])),
    ...dex.lpPositions.flatMap(p => p.pair.split("/")),
    ...dex.recentSwaps.flatMap(s => s.pair.split("/")),
  ];
  const incidents = incidentSurface(universe);
  const surfaces = { lending, dex, incidents, approvals: { status: "pending-feed" } };
  return {
    address,
    generatedAt: new Date().toISOString(),
    surfaces,
    cooked: cookedScore(surfaces),
  };
}
