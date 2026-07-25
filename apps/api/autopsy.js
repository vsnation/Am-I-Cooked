// autopsy — cross-protocol wallet risk profile as a LIBRARY (zero dependencies).
// Built on The Graph gateway. Lending coverage uses Messari standardized schemas:
// ONE query shape covers every conforming market — that is why a 10-second autopsy
// is feasible. Designed for extraction as a standalone skill package.


const GATEWAY = "https://gateway.thegraph.com/api";

// Incident registry is injected (browser fetches it, server reads it) — keeps this
// module dependency-free and isomorphic.
let INCIDENTS = null;
export function loadIncidents(data) { INCIDENTS = data; }
function registry() {
  if (!INCIDENTS) throw new Error("incidents registry not loaded — call loadIncidents(json) first");
  return INCIDENTS;
}

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

export async function gql(auth, subgraphId, query, variables = {}) {
  // auth: an API key (server/CLI use) OR { proxyBase } (browser use — the key stays
  // server-side in a reverse proxy that injects it)
  const base = typeof auth === "object" && auth?.proxyBase ? auth.proxyBase : `${GATEWAY}/${auth}`;
  const r = await fetch(`${base}/subgraphs/id/${subgraphId}`, {
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
      poolTvlUSD: Number(p.pool.totalValueLockedUSD ?? 0),
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
  for (const inc of registry().incidents) {
    const hit = terms.find(term =>
      inc.matchKeys.some(k => k === term || (k.length >= 5 && term.includes(k)) || (term.length >= 5 && k.includes(term))));
    if (hit) matches.push({ target: inc.target, date: inc.date, lostUSD: inc.lostUSD, type: inc.type, recovered: inc.recovered, matchedOn: hit });
  }
  return {
    method: "name/symbol cross-reference vs curated registry (176 incidents; address-level matching lives in the approvals surface)",
    registrySize: registry().incidents.length,
    matches,
    incidentLossUSD: matches.reduce((a, m) => a + m.lostUSD, 0),
  };
}

/** Ghost-portfolio surface: value parked where nothing lives anymore — LP positions in
 *  near-empty pools, positions in protocols from the incident registry that never
 *  recovered. Signals, not balances: precise USD sizing needs per-position accounting. */
export function ghostSurface(lending, dex) {
  const items = [];
  for (const p of dex.lpPositions) {
    if (Number(p.liquidity) > 0 && p.poolTvlUSD < 10_000)
      items.push({ where: `LP ${p.pair}`, why: `pool TVL $${Math.round(p.poolTvlUSD)} — effectively dead` });
    const dead = registry().incidents.find(i => i.recovered === "gone" &&
      p.pair.toLowerCase().split("/").some(t => i.matchKeys.includes(t)));
    if (dead && Number(p.liquidity) > 0)
      items.push({ where: `LP ${p.pair}`, why: `${dead.target} never recovered (${dead.date})` });
  }
  for (const src of lending) for (const p of src.openPositions) {
    const dead = registry().incidents.find(i => i.recovered === "gone" &&
      i.matchKeys.some(k => (p.market ?? "").toLowerCase().includes(k)));
    if (dead) items.push({ where: `${src.source} · ${p.market}`, why: `${dead.target} (${dead.date})` });
  }
  return { items, score: Math.min(100, items.length * 45) };
}

/** Behavioral surface (heuristic v0, documented as such): the worst day is the day with
 *  the largest swap outflow relative to this wallet's own typical size — a proxy until
 *  realized-loss accounting lands. */
export function behavioralSurface(dex) {
  const swaps = dex.recentSwaps.filter(s => s.amountUSD > 0);
  if (swaps.length < 3) return { worstDay: null, score: 0, note: "not enough swap history" };
  const byDay = {};
  for (const s of swaps) {
    const day = new Date(s.ts * 1000).toISOString().slice(0, 10);
    byDay[day] = byDay[day] ?? { volumeUSD: 0, biggest: 0, pair: "" };
    byDay[day].volumeUSD += s.amountUSD;
    if (s.amountUSD > byDay[day].biggest) { byDay[day].biggest = s.amountUSD; byDay[day].pair = s.pair; }
  }
  const [day, w] = Object.entries(byDay).sort((a, b) => b[1].volumeUSD - a[1].volumeUSD)[0];
  const median = swaps.map(s => s.amountUSD).sort((a, b) => a - b)[Math.floor(swaps.length / 2)];
  const ratio = median > 0 ? w.biggest / median : 0;
  return {
    worstDay: { date: day, volumeUSD: Math.round(w.volumeUSD), biggestSwapUSD: Math.round(w.biggest), pair: w.pair },
    score: Math.min(100, Math.round(ratio * 4)),
    note: "size-vs-typical heuristic; realized-loss accounting pending",
  };
}

/** Cooked score. Transparent formula, final weights live in the sealed judge:
 *  open wounds 40 · exploit exposure 25 · ghost 20 · behavioral 15. If the approvals
 *  feed is unavailable the score is reported as partial, never presented as the full
 *  verdict. */
export function cookedScore(surfaces) {
  const exploit = Math.min(100, surfaces.incidents.matches.length * 34);
  const ghost = surfaces.ghost?.score ?? 0;
  const behavioral = surfaces.behavioral?.score ?? 0;
  const wounds = typeof surfaces.approvals?.score === "number" ? surfaces.approvals.score : null;
  // rubric weights: wounds .40 · exploit .25 · ghost .20 · behavioral .15
  const score = Math.round((wounds ?? 0) * 0.40 + exploit * 0.25 + ghost * 0.20 + behavioral * 0.15);
  const bands = [[20, "RARE"], [40, "MEDIUM RARE"], [60, "MEDIUM WELL"], [80, "COOKED"], [100, "CHARCOAL"]];
  return {
    partial: wounds === null,
    pendingFeeds: wounds === null ? ["approvals(40%)"] : [],
    components: { openWounds: wounds, exploitExposure: exploit, ghostPortfolio: ghost, behavioral },
    score,
    band: bands.find(([max]) => score <= max)[1],
  };
}

/** Full autopsy: the four risk surfaces. Pass opts.rpcUrl to light up the approvals
 *  feed (open wounds); without it — or if the RPC fails — the score degrades to
 *  partial instead of the scan dying. */
export async function autopsy(apiKey, address, opts = {}) {
  // Approvals come from an injected provider so this module stays isomorphic and free of
  // an RPC dependency — the server passes a multichain provider (see apps/api/onchain.js).
  const [lending, dex, approvals] = await Promise.all([
    lendingSurface(apiKey, address),
    dexSurface(apiKey, address),
    opts.approvals
      ? Promise.resolve(opts.approvals(address))
          .catch(e => ({ status: "unavailable", error: e.message }))
      : Promise.resolve({ status: "pending-feed" }),
  ]);
  const universe = [
    ...lending.flatMap(l => l.openPositions.flatMap(p => [p.market, p.token])),
    ...dex.lpPositions.flatMap(p => p.pair.split("/")),
    ...dex.recentSwaps.flatMap(s => s.pair.split("/")),
    ...(approvals.items || []).map(i => i.tokenSymbol).filter(Boolean),
  ];
  const incidents = incidentSurface(universe);
  const surfaces = {
    lending, dex, incidents,
    ghost: ghostSurface(lending, dex),
    behavioral: behavioralSurface(dex),
    approvals,
  };
  return {
    address,
    generatedAt: new Date().toISOString(),
    surfaces,
    cooked: cookedScore(surfaces),
  };
}
