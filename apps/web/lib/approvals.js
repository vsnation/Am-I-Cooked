// approvals — live ERC20 approval feed → the "open wounds" surface (40% of the rubric).
// Source: raw Approval(owner, spender, value) logs over JSON-RPC. One full-range
// eth_getLogs where the provider allows it, automatic chunked fallback where it
// doesn't. Events give the history; every surviving (token, spender) pair is then
// re-verified with a live allowance() call — the call is the source of truth, so
// revoked approvals are never reported as open. Zero dependencies, isomorphic.

const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const SEL_ALLOWANCE = "0xdd62ed3e";
const SEL_SYMBOL = "0x95d89b41";
const SEL_DECIMALS = "0x313ce567";
// Jun 2020 — approvals granted before DeFi summer are noise for live wounds; the
// allowance() re-check catches anything older that still matters via later re-approvals.
const DEFAULT_FROM_BLOCK = 10_000_000;
// ≥ 2^128 counts as unlimited in practice (max-uint256, max-uint160 Permit2, max-uint96).
const UNLIMITED_FLOOR = 1n << 128n;
const BLOCK_SECONDS = 12;
const META_TOP = 300; // symbol()/decimals() fetched for the top of the sorted wound list

// Widely-used spenders: an unlimited allowance here is still a wound the Surgeon can
// close, but it is battle-tested infrastructure, not an unknown contract holding keys.
const KNOWN_SPENDERS = {
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": "Uniswap V2 Router",
  "0xe592427a0aece92de3edee1f18e0157c05861564": "Uniswap V3 Router",
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "Uniswap V3 Router 2",
  "0x000000000022d473030f116ddee9f6b43ac78ba3": "Permit2",
  "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch v5",
  "0x111111125421ca6dc452d289314280a0f8842a65": "1inch v6",
  "0xc92e8bdf79f0507f65a392b0ab4667716bfe0110": "CoW Protocol relayer",
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x Exchange Proxy",
  "0x881d40237659c251811cec9c364ef91dc08d300c": "MetaMask Swap Router",
};

const pad32 = v => v.toLowerCase().replace(/^0x/, "").padStart(64, "0");

async function rpc(url, method, params) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body });
    const text = await r.text();
    if (r.ok && text.trimStart().startsWith("{")) {
      const out = JSON.parse(text);
      if (out.error) throw new Error(`${method}: ${out.error.message}`);
      return out.result;
    }
    // rate-limited or an HTML error page — back off and retry, JSON-RPC errors throw above
    if (attempt >= 4) throw new Error(`${method}: provider unavailable (HTTP ${r.status})`);
    await new Promise(res => setTimeout(res, 800 * 2 ** attempt));
  }
}

/** Batched eth_call; returns results aligned to `calls`, null for individual failures
 *  (a token with a reverting symbol() must not sink the whole surface). Public RPCs
 *  rate-limit bursts, so batches are paced and 429/non-JSON responses retried. */
async function rpcBatch(url, calls, { chunkSize = 250, spacingMs = 1200 } = {}) {
  const results = new Array(calls.length).fill(null);
  for (let i = 0; i < calls.length; i += chunkSize) {
    const chunk = calls.slice(i, i + chunkSize);
    const body = JSON.stringify(chunk.map((c, j) =>
      ({ jsonrpc: "2.0", id: i + j, method: "eth_call", params: [c, "latest"] })));
    for (let attempt = 0; ; attempt++) {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body });
      const text = await r.text();
      if (r.ok && text.trimStart().startsWith("[")) {
        for (const item of JSON.parse(text))
          if (item.result !== undefined && typeof item.id === "number") results[item.id] = item.result;
        break;
      }
      if (attempt >= 4) throw new Error(`eth_call batch failed after retries (HTTP ${r.status})`);
      await new Promise(res => setTimeout(res, 800 * 2 ** attempt));
    }
    if (i + chunkSize < calls.length) await new Promise(res => setTimeout(res, spacingMs));
  }
  return results;
}

/** All Approval logs where `owner` granted: full-range first, 50k-block chunks with
 *  gentle pacing when the provider caps the range. */
export async function approvalEvents(rpcUrl, owner, { fromBlock = DEFAULT_FROM_BLOCK } = {}) {
  const filter = topics => ({ fromBlock: "0x" + fromBlock.toString(16), toBlock: "latest", topics });
  const topics = [APPROVAL_TOPIC, "0x" + pad32(owner)];
  const tip = parseInt(await rpc(rpcUrl, "eth_blockNumber", []), 16);
  try {
    const logs = await rpc(rpcUrl, "eth_getLogs", [filter(topics)]);
    return { logs, tip, chunked: false };
  } catch (e) {
    if (!/range|limit|10000|50000/i.test(e.message)) throw e;
  }
  const logs = [];
  const STEP = 50_000;
  for (let from = fromBlock; from <= tip; from += STEP) {
    const to = Math.min(from + STEP - 1, tip);
    for (let attempt = 0; ; attempt++) {
      try {
        logs.push(...await rpc(rpcUrl, "eth_getLogs",
          [{ fromBlock: "0x" + from.toString(16), toBlock: "0x" + to.toString(16), topics }]));
        break;
      } catch (e) {
        if (attempt >= 3) throw new Error(`log scan failed at block ${from}: ${e.message}`);
        await new Promise(r => setTimeout(r, 400 * 2 ** attempt));
      }
    }
    await new Promise(r => setTimeout(r, 120));
  }
  return { logs, tip, chunked: true };
}

/** Latest Approval per (token, spender) — later events overwrite earlier ones. */
export function latestPairs(logs) {
  const pairs = new Map();
  for (const log of logs) {
    const key = `${log.address.toLowerCase()}:${log.topics[2]}`;
    const prev = pairs.get(key);
    const bn = parseInt(log.blockNumber, 16), ix = parseInt(log.logIndex, 16);
    if (!prev || bn > prev.bn || (bn === prev.bn && ix > prev.ix)) {
      pairs.set(key, {
        token: log.address.toLowerCase(),
        spender: "0x" + log.topics[2].slice(26),
        approvedValue: BigInt(log.data === "0x" ? 0 : log.data),
        bn, ix,
      });
    }
  }
  return [...pairs.values()];
}

function decodeString(hex) {
  if (!hex || hex === "0x") return null;
  const raw = hex.replace(/^0x/, "");
  let bytes;
  if (raw.length === 64) bytes = raw; // legacy bytes32 symbol
  else {
    const len = parseInt(raw.slice(64, 128), 16);
    bytes = raw.slice(128, 128 + len * 2);
  }
  const s = (bytes.match(/../g) ?? []).map(b => parseInt(b, 16)).filter(c => c >= 32 && c < 127)
    .map(c => String.fromCharCode(c)).join("");
  return s || null;
}

/** Live approvals for `owner`: event history reduced to pairs, then re-verified with
 *  allowance() calls, decorated with token metadata and address-level incident tags. */
export async function approvalsSurface(rpcUrl, owner, incidents, opts = {}) {
  const t0 = Date.now();
  const { logs, tip, chunked } = await approvalEvents(rpcUrl, owner, opts);
  const pairs = latestPairs(logs).filter(p => p.approvedValue > 0n);

  const allowances = await rpcBatch(rpcUrl, pairs.map(p => ({
    to: p.token, data: SEL_ALLOWANCE + pad32(owner) + pad32(p.spender),
  })));
  const open = pairs
    .map((p, i) => ({ ...p, allowance: (allowances[i] && allowances[i] !== "0x") ? BigInt(allowances[i]) : 0n }))
    .filter(p => p.allowance > 0n);

  const byAddress = Object.fromEntries(
    (incidents?.addresses ?? []).map(a => [a.address.toLowerCase(), a]));

  const now = Date.now() / 1000;
  const wounds = open.map(p => {
    const unlimited = p.allowance >= UNLIMITED_FLOOR;
    const grantedAtEst = now - (tip - p.bn) * BLOCK_SECONDS;
    const ageYears = (now - grantedAtEst) / 31_536_000;
    const hit = byAddress[p.spender] ?? byAddress[p.token];
    const label = KNOWN_SPENDERS[p.spender] ?? null;
    const reasons = [];
    if (hit) reasons.push(`${hit.kind} address from the ${hit.target} incident`);
    if (unlimited) reasons.push(label ? `unlimited allowance to ${label}` : "unlimited allowance to an unrecognized contract");
    if (ageYears > 2) reasons.push(`granted ~${ageYears.toFixed(1)}y ago and never revoked`);
    return {
      token: p.token, symbol: null, decimals: null,
      spender: p.spender, spenderLabel: label,
      allowance: unlimited ? "unlimited" : p.allowance.toString(),
      unlimited,
      grantedBlock: p.bn,
      grantedAtEst: new Date(grantedAtEst * 1000).toISOString().slice(0, 10),
      incident: hit ? { target: hit.target, kind: hit.kind } : null,
      risk: hit ? "critical" : unlimited ? (label ? "medium" : "high") : ageYears > 2 ? "medium" : "low",
      reasons,
    };
  }).sort((a, b) => ({ critical: 0, high: 1, medium: 2, low: 3 })[a.risk] - ({ critical: 0, high: 1, medium: 2, low: 3 })[b.risk]
      || b.grantedBlock - a.grantedBlock);

  // Token metadata only where it will be read (top of the sorted list) — a wallet can
  // hold thousands of spam-token approvals and symbol() calls are the expensive part.
  const metaTokens = [...new Set(wounds.slice(0, META_TOP).map(w => w.token))];
  const symbols = await rpcBatch(rpcUrl, metaTokens.map(t => ({ to: t, data: SEL_SYMBOL })));
  const decimals = await rpcBatch(rpcUrl, metaTokens.map(t => ({ to: t, data: SEL_DECIMALS })));
  const meta = Object.fromEntries(metaTokens.map((t, i) => [t, {
    symbol: decodeString(symbols[i]) ?? t.slice(0, 8) + "…",
    decimals: decimals[i] ? parseInt(decimals[i], 16) : 18,
  }]));
  for (const w of wounds) {
    w.symbol = meta[w.token]?.symbol ?? w.token.slice(0, 8) + "…";
    w.decimals = meta[w.token]?.decimals ?? 18;
  }

  const n = r => wounds.filter(w => w.risk === r).length;
  const score = Math.min(100, Math.max(
    n("critical") > 0 ? 70 : 0,
    n("critical") * 55 + n("high") * 18 + n("medium") * 8 + n("low") * 3,
  ));

  return {
    method: `Approval logs via JSON-RPC${chunked ? " (chunked)" : " (single range query)"} from block ${DEFAULT_FROM_BLOCK}, every pair re-verified with a live allowance() call`,
    note: "risk is allowance/incident/age based; USD value-weighting of wounds pending a price feed",
    tipBlock: tip,
    totalApprovalEvents: logs.length,
    pairsSeen: pairs.length,
    healedCount: pairs.length - open.length,
    openCount: wounds.length,
    unlimitedCount: wounds.filter(w => w.unlimited).length,
    wounds,
    score,
    elapsedMs: Date.now() - t0,
  };
}
