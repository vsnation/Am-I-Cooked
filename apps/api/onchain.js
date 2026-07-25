// onchain — multichain + revoke + ENS layer on top of the shared approvals engine
// (apps/web/lib/approvals.js). That module owns the per-chain scan (full-history logs,
// live allowance re-check, incident/spender labelling); this file runs it across chains,
// attaches a ready-to-sign revoke tx to each wound, and resolves ENS names. The revoke tx
// is PREPARED here and signed by the user's own wallet — we never hold keys.
import { createPublicClient, http, getAddress } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { approvalsSurface } from "./approvals.js";

// Chains traced for approvals (revoke.cash-style). Tenderly public gateways serve
// eth_getLogs over wide ranges with no key. Mainnet scans full history; L2s use a
// recent window (their block heights make from-genesis scans impractical).
export const CHAINS = [
  { id: 1, name: "Ethereum", rpc: "https://mainnet.gateway.tenderly.co", lookback: 3_000_000, explorer: "https://etherscan.io" }, // ~1yr; keyed archive RPC would allow full history
  { id: 8453, name: "Base", rpc: "https://base.gateway.tenderly.co", lookback: 8_000_000, explorer: "https://basescan.org" },
  { id: 42161, name: "Arbitrum", rpc: "https://arbitrum.gateway.tenderly.co", lookback: 40_000_000, explorer: "https://arbiscan.io" },
  { id: 10, name: "Optimism", rpc: "https://optimism.gateway.tenderly.co", lookback: 20_000_000, explorer: "https://optimistic.etherscan.io" },
  { id: 137, name: "Polygon", rpc: "https://polygon.gateway.tenderly.co", lookback: 10_000_000, explorer: "https://polygonscan.com" },
  { id: 43114, name: "Avalanche", rpc: "https://avalanche.gateway.tenderly.co", lookback: 10_000_000, explorer: "https://snowtrace.io" },
  { id: 100, name: "Gnosis", rpc: "https://gnosis.gateway.tenderly.co", lookback: 10_000_000, explorer: "https://gnosisscan.io" },
];

const SEL_APPROVE = "0x095ea7b3";
const pad = h => h.replace(/^0x/, "").toLowerCase().padStart(64, "0");

/** The transaction that revokes an approval: approve(spender, 0). The USER signs it. */
export function buildRevoke(chainId, token, spender) {
  return { chainId, to: getAddress(token), value: "0x0", data: SEL_APPROVE + pad(spender) + pad("0") };
}

/** Accepts a 0x address or an ENS name; returns a checksummed address. */
export async function resolveAddress(input, ensRpc = "https://ethereum-rpc.publicnode.com") {
  const raw = (input || "").trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(raw)) return getAddress(raw);
  if (/\.eth$/i.test(raw)) {
    const client = createPublicClient({ chain: mainnet, transport: http(ensRpc) });
    const addr = await client.getEnsAddress({ name: normalize(raw) });
    if (!addr) throw new Error(`ENS name "${raw}" does not resolve to an address`);
    return getAddress(addr);
  }
  throw new Error("input must be a 0x… address or an ENS name (…​.eth)");
}

async function chainTip(rpc) {
  const r = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }) });
  return parseInt((await r.json()).result, 16);
}

/** Multichain open-wounds surface: run the shared engine on every chain, tag each wound
 *  with its chain and a prepared revoke tx, merge, and combine the score. */
export async function multichainApprovals(owner, incidents, opts = {}) {
  const perChain = await Promise.all(CHAINS.map(async ch => {
    try {
      let fromBlock = ch.fromBlock;
      if (ch.lookback) { const tip = await chainTip(ch.rpc); fromBlock = Math.max(0, tip - ch.lookback); }
      const surface = await approvalsSurface(ch.rpc, owner, incidents, { fromBlock });
      return (surface.wounds || []).map(w => ({
        ...w, chain: ch.name, chainId: ch.id, explorer: ch.explorer,
        revoke: buildRevoke(ch.id, w.token, w.spender),
      }));
    } catch { return []; }
  }));

  const items = perChain.flat().sort((a, b) =>
    ({ critical: 0, high: 1, medium: 2, low: 3 })[a.risk] - ({ critical: 0, high: 1, medium: 2, low: 3 })[b.risk]);

  const n = r => items.filter(w => w.risk === r).length;
  const score = Math.min(100, Math.max(
    n("critical") > 0 ? 70 : 0,
    n("critical") * 55 + n("high") * 18 + n("medium") * 8 + n("low") * 3,
  ));
  return {
    method: "multichain approval-log scan (7 EVM chains) + live allowance re-check; each wound carries a prepared approve(spender,0) revoke tx",
    items,
    score,
    chains: [...new Set(items.map(i => i.chain))],
    counts: { total: items.length, critical: n("critical"), unlimited: items.filter(i => i.unlimited).length },
  };
}
