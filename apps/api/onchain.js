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
  { id: 1, name: "Ethereum", rpc: "https://mainnet.gateway.tenderly.co", lookback: 3_000_000, blockSeconds: 12, explorer: "https://etherscan.io" }, // ~1yr; keyed archive RPC would allow full history
  { id: 8453, name: "Base", rpc: "https://base.gateway.tenderly.co", lookback: 8_000_000, blockSeconds: 2, explorer: "https://basescan.org" },
  { id: 42161, name: "Arbitrum", rpc: "https://arbitrum.gateway.tenderly.co", lookback: 40_000_000, blockSeconds: 0.25, explorer: "https://arbiscan.io" },
  { id: 10, name: "Optimism", rpc: "https://optimism.gateway.tenderly.co", lookback: 20_000_000, blockSeconds: 2, explorer: "https://optimistic.etherscan.io" },
  { id: 137, name: "Polygon", rpc: "https://polygon.gateway.tenderly.co", lookback: 10_000_000, blockSeconds: 2.1, explorer: "https://polygonscan.com" },
  { id: 43114, name: "Avalanche", rpc: "https://avalanche.gateway.tenderly.co", lookback: 10_000_000, blockSeconds: 2, explorer: "https://snowtrace.io" },
  { id: 100, name: "Gnosis", rpc: "https://gnosis.gateway.tenderly.co", lookback: 10_000_000, blockSeconds: 5, explorer: "https://gnosisscan.io" },
  { id: 59144, name: "Linea", rpc: "https://linea.gateway.tenderly.co", lookback: 8_000_000, blockSeconds: 2, explorer: "https://lineascan.build" },
  { id: 5000, name: "Mantle", rpc: "https://mantle.gateway.tenderly.co", lookback: 8_000_000, blockSeconds: 2, explorer: "https://mantlescan.xyz" },
  { id: 81457, name: "Blast", rpc: "https://blast.gateway.tenderly.co", lookback: 8_000_000, blockSeconds: 2, explorer: "https://blastscan.io" },
  { id: 324, name: "zkSync Era", rpc: "https://zksync.gateway.tenderly.co", lookback: 15_000_000, blockSeconds: 1, explorer: "https://era.zksync.network" },
  { id: 480, name: "World Chain", rpc: "https://worldchain-mainnet.gateway.tenderly.co", lookback: 8_000_000, blockSeconds: 2, explorer: "https://worldscan.org" },
  { id: 130, name: "Unichain", rpc: "https://unichain.gateway.tenderly.co", lookback: 15_000_000, blockSeconds: 1, explorer: "https://uniscan.xyz" },
  { id: 146, name: "Sonic", rpc: "https://sonic.gateway.tenderly.co", lookback: 15_000_000, blockSeconds: 1, explorer: "https://sonicscan.org" },
  { id: 80094, name: "Berachain", rpc: "https://berachain.gateway.tenderly.co", lookback: 8_000_000, blockSeconds: 2, explorer: "https://berascan.com" },
  { id: 57073, name: "Ink", rpc: "https://ink.gateway.tenderly.co", lookback: 15_000_000, blockSeconds: 1, explorer: "https://explorer.inkonchain.com" },
  { id: 1868, name: "Soneium", rpc: "https://soneium.gateway.tenderly.co", lookback: 8_000_000, blockSeconds: 2, explorer: "https://soneium.blockscout.com" },
  { id: 252, name: "Fraxtal", rpc: "https://fraxtal.gateway.tenderly.co", lookback: 8_000_000, blockSeconds: 2, explorer: "https://fraxscan.com" },
  { id: 42220, name: "Celo", rpc: "https://celo.gateway.tenderly.co", lookback: 15_000_000, blockSeconds: 1, explorer: "https://celoscan.io" },
  { id: 1284, name: "Moonbeam", rpc: "https://moonbeam.gateway.tenderly.co", lookback: 1_500_000, blockSeconds: 12, explorer: "https://moonbeam.moonscan.io" },
  { id: 2020, name: "Ronin", rpc: "https://ronin.gateway.tenderly.co", lookback: 5_000_000, blockSeconds: 3, explorer: "https://app.roninchain.com" },
];

const SEL_APPROVE = "0x095ea7b3";
const pad = h => h.replace(/^0x/, "").toLowerCase().padStart(64, "0");

/** The transaction that revokes an approval: approve(spender, 0). The USER signs it. */
export function buildRevoke(chainId, token, spender) {
  return { chainId, to: getAddress(token), value: "0x0", data: SEL_APPROVE + pad(spender) + pad("0") };
}

// ENS resolution must never hinge on one provider being up: short per-RPC timeout,
// no viem retries (the fallback list IS the retry), next RPC on transport failure.
const ENS_RPCS = [
  "https://ethereum-rpc.publicnode.com",
  "https://mainnet.gateway.tenderly.co",
  "https://cloudflare-eth.com",
];

/** Accepts a 0x address or an ENS name; returns a checksummed address. */
export async function resolveAddress(input, ensRpcs = ENS_RPCS) {
  const raw = (input || "").trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(raw)) return getAddress(raw);
  if (!/\.eth$/i.test(raw)) throw new Error("input must be a 0x… address or an ENS name (…​.eth)");
  const name = normalize(raw);
  let lastErr;
  for (const rpc of Array.isArray(ensRpcs) ? ensRpcs : [ensRpcs]) {
    try {
      const client = createPublicClient({ chain: mainnet, transport: http(rpc, { timeout: 4000, retryCount: 0 }) });
      const addr = await client.getEnsAddress({ name });
      // null is an authoritative answer (name has no address) — not a transport error
      if (!addr) throw Object.assign(new Error(`ENS name "${raw}" does not resolve to an address`), { permanent: true });
      return getAddress(addr);
    } catch (e) {
      if (e.permanent) throw e;
      lastErr = e;
    }
  }
  throw new Error(`ENS resolution unavailable (${lastErr?.shortMessage || lastErr?.message || "all RPCs failed"})`);
}

async function chainTip(rpc, signal) {
  const r = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }), signal });
  if (!r.ok) throw new Error(`eth_blockNumber: HTTP ${r.status}`);
  const tip = parseInt((await r.json())?.result, 16);
  // NaN here used to flow into fromBlock as "0xNaN", so the chain failed one RPC call
  // later and was written off as "skipped" with no idea why. Fail where it happens.
  if (!Number.isFinite(tip)) throw new Error("eth_blockNumber returned no usable tip");
  return tip;
}

/** Multichain open-wounds surface: run the shared engine on every chain, tag each wound
 *  with its chain and a prepared revoke tx, merge, and combine the score. */
// A wallet can hold thousands of approvals; the response is JSON in memory on both ends
// and every item carries a prepared revoke tx. Keep the risk-sorted head, count the rest.
const MAX_ITEMS = Number(process.env.MAX_WOUND_ITEMS || 500);

export async function multichainApprovals(owner, incidents, opts = {}) {
  // The UI tells users a heavy wallet's first scan takes ~30s, but the old 22s cap meant
  // mainnet's chunked history reliably lost the race and got written off as "skipped".
  const budget = opts.perChainMs ?? Number(process.env.PER_CHAIN_MS || 45000);
  const skipped = [];
  const perChain = await Promise.all(CHAINS.map(async ch => {
    // Losing a Promise.race does NOT stop the loser: the old code left a full chunked
    // log scan running against the provider for minutes after the answer was discarded.
    const ctl = new AbortController();
    const kill = setTimeout(() => ctl.abort(), budget);
    try {
      let fromBlock = ch.fromBlock;
      if (ch.lookback) { const tip = await chainTip(ch.rpc, ctl.signal); fromBlock = Math.max(0, tip - ch.lookback); }
      const surface = await approvalsSurface(ch.rpc, owner, incidents,
        { fromBlock, blockSeconds: ch.blockSeconds, signal: ctl.signal });
      return (surface.wounds || []).map(w => ({
        ...w, chain: ch.name, chainId: ch.id, explorer: ch.explorer,
        revoke: buildRevoke(ch.id, w.token, w.spender),
      }));
    } catch (e) {
      skipped.push({ chain: ch.name, reason: ctl.signal.aborted ? `timeout after ${budget}ms` : (e.message || "failed") });
      return [];
    } finally { clearTimeout(kill); }
  }));

  const rank = { critical: 0, high: 1, medium: 2, low: 3 };
  const all = perChain.flat().sort((a, b) => rank[a.risk] - rank[b.risk]);
  const items = all.slice(0, MAX_ITEMS);

  const n = r => all.filter(w => w.risk === r).length;
  const score = Math.min(100, Math.max(
    n("critical") > 0 ? 70 : 0,
    n("critical") * 55 + n("high") * 18 + n("medium") * 8 + n("low") * 3,
  ));
  const scanned = CHAINS.length - skipped.length;
  return {
    method: `multichain approval-log scan (${scanned}/${CHAINS.length} EVM chains) + live allowance re-check; each wound carries a prepared approve(spender,0) revoke tx`,
    items,
    itemsTruncated: all.length - items.length,
    score,
    chains: [...new Set(all.map(i => i.chain))],
    chainsScanned: scanned,
    skipped,
    // Explicit so nothing downstream has to infer coverage from array lengths: a scan
    // that lost chains cannot claim "no open wounds", it can only claim "none found here".
    coverage: { scanned, total: CHAINS.length, complete: skipped.length === 0 },
    counts: { total: all.length, critical: n("critical"), unlimited: all.filter(i => i.unlimited).length },
  };
}
