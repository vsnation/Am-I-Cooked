// autopsy — cross-protocol wallet risk profile as a LIBRARY (zero dependencies).
// Built on The Graph gateway. Lending coverage uses Messari standardized schemas:
// ONE query shape covers every conforming market — that is why a 10-second autopsy
// is feasible. Designed for extraction as a standalone skill package.

const GATEWAY = "https://gateway.thegraph.com/api";

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
  swaps(first: 10, orderBy: timestamp, orderDirection: desc, where: { origin: $addr }) {
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

/** Full autopsy: the four risk surfaces. Approvals + incident cross-reference are
 *  separate feeds (approval-event indexing / curated incident metadata) — wired next. */
export async function autopsy(apiKey, address) {
  const [lending, dex] = await Promise.all([
    lendingSurface(apiKey, address),
    dexSurface(apiKey, address),
  ]);
  return {
    address,
    generatedAt: new Date().toISOString(),
    surfaces: {
      lending,
      dex,
      approvals: { status: "pending-feed" },
      incidents: { status: "pending-feed" },
    },
  };
}
