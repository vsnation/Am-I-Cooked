// onchain — server-side RPC layer (viem). Two jobs the Graph can't do:
//   1. resolve ENS names → addresses
//   2. the "open wounds" surface: live ERC-20 approvals + a ready-to-sign revoke tx
// The revoke tx is PREPARED here and signed by the user's own wallet — we never hold keys.
import { createPublicClient, http, getAddress, parseAbi, encodeFunctionData, maxUint256 } from "viem";
import { mainnet, base, arbitrum, optimism, polygon, avalanche, gnosis } from "viem/chains";
import { normalize } from "viem/ens";

const ERC20 = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// Chains we trace (revoke.cash-style). Tenderly public gateways serve eth_getLogs with
// wide ranges and no key — one endpoint pattern per chain.
export const CHAINS = [
  { id: 1, name: "Ethereum", chain: mainnet, rpc: "https://mainnet.gateway.tenderly.co", explorer: "https://etherscan.io" },
  { id: 8453, name: "Base", chain: base, rpc: "https://base.gateway.tenderly.co", explorer: "https://basescan.org" },
  { id: 42161, name: "Arbitrum", chain: arbitrum, rpc: "https://arbitrum.gateway.tenderly.co", explorer: "https://arbiscan.io" },
  { id: 10, name: "Optimism", chain: optimism, rpc: "https://optimism.gateway.tenderly.co", explorer: "https://optimistic.etherscan.io" },
  { id: 137, name: "Polygon", chain: polygon, rpc: "https://polygon.gateway.tenderly.co", explorer: "https://polygonscan.com" },
  { id: 43114, name: "Avalanche", chain: avalanche, rpc: "https://avalanche.gateway.tenderly.co", explorer: "https://snowtrace.io" },
  { id: 100, name: "Gnosis", chain: gnosis, rpc: "https://gnosis.gateway.tenderly.co", explorer: "https://gnosisscan.io" },
];

export function makeClient(rpcUrl, chain) {
  return createPublicClient({ chain, transport: http(rpcUrl) });
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

/** Build the transaction that revokes an approval. The USER signs this in their wallet. */
export function buildRevoke(token, spender, chainId) {
  return {
    chainId,
    to: getAddress(token),
    data: encodeFunctionData({ abi: ERC20, functionName: "approve", args: [getAddress(spender), 0n] }),
    value: "0x0",
  };
}

const UNLIMITED = maxUint256 / 2n; // treat anything above half of 2^256 as effectively unlimited

/** Open-wounds surface: which of this wallet's LIVE approvals are dangerous, each with a
 *  prepared revoke tx. Scans a bounded recent window of Approval logs, then confirms the
 *  CURRENT allowance on-chain (already-revoked approvals read 0 and drop out). */
async function approvalsOnChain(chain, owner, drainerSet, opts = {}) {
  const client = makeClient(chain.rpc, chain.chain);
  const lookback = BigInt(opts.lookbackBlocks ?? 2_000_000);
  const chunk = BigInt(opts.chunkBlocks ?? 900_000); // Tenderly serves ~1M-block ranges; few big calls, not many small
  const latest = await client.getBlockNumber();
  const from = latest > lookback ? latest - lookback : 0n;
  const ranges = [];
  for (let b = from; b <= latest; b += chunk + 1n) ranges.push([b, b + chunk > latest ? latest : b + chunk]);

  // gather (token, spender) pairs this wallet ever approved in the window
  const APPROVAL = { type: "event", name: "Approval",
    inputs: [{ indexed: true, name: "owner", type: "address" }, { indexed: true, name: "spender", type: "address" }, { indexed: false, name: "value", type: "uint256" }] };
  const logs = [];
  for (const [a, z] of ranges) {
    try { logs.push(...await client.getLogs({ event: APPROVAL, args: { owner }, fromBlock: a, toBlock: z })); }
    catch { /* range unsupported on this gateway — skip */ }
  }

  const pairs = new Map(); // token|spender -> {token, spender}
  for (const l of logs) {
    const token = l.address, spender = l.args?.spender;
    if (!spender) continue;
    pairs.set(`${token.toLowerCase()}|${spender.toLowerCase()}`, { token, spender });
  }
  const list = [...pairs.values()].slice(0, 80);
  if (list.length === 0) return [];

  // confirm CURRENT allowance + fetch symbol in one multicall
  const calls = list.flatMap(p => [
    { address: p.token, abi: ERC20, functionName: "allowance", args: [owner, p.spender] },
    { address: p.token, abi: ERC20, functionName: "symbol" },
  ]);
  const res = await client.multicall({ contracts: calls, allowFailure: true });

  const items = [];
  for (let i = 0; i < list.length; i++) {
    const allowance = res[i * 2]?.status === "success" ? res[i * 2].result : 0n;
    if (allowance === 0n) continue; // already revoked / never live
    const symbol = res[i * 2 + 1]?.status === "success" ? res[i * 2 + 1].result : "?";
    const { token, spender } = list[i];
    const unlimited = allowance >= UNLIMITED;
    const flags = [];
    if (drainerSet.has(spender.toLowerCase())) flags.push("known-drainer");
    if (unlimited) flags.push("unlimited");
    items.push({
      chain: chain.name, chainId: chain.id,
      token, tokenSymbol: symbol, spender,
      spenderShort: `${spender.slice(0, 6)}…${spender.slice(-4)}`,
      allowance: unlimited ? "unlimited" : allowance.toString(),
      unlimited, flags,
      revoke: buildRevoke(token, spender, chain.id),
    });
  }
  return items;
}

/** Multichain open-wounds surface: trace live dangerous approvals across every chain,
 *  each with a prepared, chain-tagged revoke tx. */
export async function approvalsSurface(owner, drainers, opts = {}) {
  const drainerSet = new Set((drainers || []).map(a => a.toLowerCase()));
  const perChain = await Promise.all(CHAINS.map(ch =>
    approvalsOnChain(ch, owner, drainerSet, opts).catch(() => [])));
  const items = perChain.flat();
  items.sort((a, b) => (b.flags.length - a.flags.length) || (b.unlimited - a.unlimited));
  const severe = items.filter(i => i.flags.includes("known-drainer")).length;
  const unlimited = items.filter(i => i.unlimited).length;
  const score = Math.min(100, severe * 60 + unlimited * 22 + items.length * 3);
  const chainsHit = [...new Set(items.map(i => i.chain))];
  return { items, score, counts: { total: items.length, unlimited, drainer: severe }, chains: chainsHit };
}
