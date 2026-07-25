// alarm — the guardian layer. Watches DeFi liquidity for large outflows and raises an
// alarm when a pool/protocol is draining, so an exposed wallet can revoke before it's
// hit. Source-agnostic: a `source` streams {poolId, protocol, tvlUSD, ts} samples in;
// today that's subgraph polling, tomorrow a composed Substreams sink — the engine and
// UI don't change. An alarm always corresponds to a real (or clearly-labeled replayed)
// outflow — never fabricated.

const WINDOW_MS = 12 * 60 * 1000;   // look back this far for a drop
const MIN_TVL = 250_000;            // ignore dust pools — a $200 pool "draining" is noise
const DROP_TRIGGER = 0.25;          // ≥25% TVL gone in the window = alarm
// The top-40 pool set churns, and this engine runs for the life of the process: without
// eviction every pool ever polled stayed in memory forever.
const RETAIN_MS = 60 * 60 * 1000;   // drop pools that stopped reporting an hour ago
const PRUNE_EVERY = 250;            // observations between sweeps

export class AlarmEngine {
  constructor(opts = {}) {
    this.now = opts.now ?? (() => Date.now());
    this.history = new Map();   // poolId -> [{ts, tvlUSD}]
    this.alarms = new Map();    // poolId -> alarm
    this.meta = new Map();      // poolId -> {protocol, pair}
    this.listeners = new Set();
    this.seen = 0;
  }

  onAlarm(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  /** Forget pools that stopped reporting — history, alarm and metadata together. */
  prune(now = this.now()) {
    for (const [poolId, hist] of this.history) {
      const last = hist.length ? hist[hist.length - 1].ts : 0;
      if (now - last <= RETAIN_MS) continue;
      this.history.delete(poolId);
      this.alarms.delete(poolId);
      this.meta.delete(poolId);
    }
  }

  // Feed one liquidity sample. Returns an alarm if this sample triggered/updated one.
  observe({ poolId, protocol, pair, tvlUSD, ts, replay = false }) {
    ts = ts ?? this.now();
    if (++this.seen % PRUNE_EVERY === 0) this.prune(ts);
    if (protocol || pair) this.meta.set(poolId, { protocol: protocol ?? this.meta.get(poolId)?.protocol, pair: pair ?? this.meta.get(poolId)?.pair });
    const hist = this.history.get(poolId) ?? [];
    hist.push({ ts, tvlUSD });
    while (hist.length && ts - hist[0].ts > WINDOW_MS) hist.shift();
    this.history.set(poolId, hist);

    const peak = Math.max(...hist.map(h => h.tvlUSD));
    if (peak < MIN_TVL) return null;
    const drop = (peak - tvlUSD) / peak;
    if (drop < DROP_TRIGGER) return null;

    const m = this.meta.get(poolId) ?? {};
    const alarm = {
      poolId, protocol: m.protocol ?? "unknown pool", pair: m.pair ?? poolId.slice(0, 10),
      peakTvlUSD: Math.round(peak), nowTvlUSD: Math.round(tvlUSD),
      dropPct: Math.round(drop * 100),
      severity: drop >= 0.6 ? "critical" : drop >= 0.4 ? "high" : "elevated",
      firstSeen: this.alarms.get(poolId)?.firstSeen ?? ts,
      updatedAt: ts, replay,
    };
    const isNew = !this.alarms.has(poolId);
    this.alarms.set(poolId, alarm);
    if (isNew) for (const fn of this.listeners) { try { fn(alarm); } catch {} }
    return alarm;
  }

  active() {
    // an alarm goes stale if its pool stops reporting (or recovers) for a while
    const now = this.now();
    return [...this.alarms.values()]
      .filter(a => now - a.updatedAt < WINDOW_MS)
      .sort((a, b) => ({ critical: 0, high: 1, elevated: 2 })[a.severity] - ({ critical: 0, high: 1, elevated: 2 })[b.severity] || b.dropPct - a.dropPct);
  }

  // Personal alarms: only pools/protocols this scanned wallet is actually exposed to.
  forExposure(report) {
    const exposure = new Set();
    const add = s => s && exposure.add(String(s).toLowerCase());
    const surf = report?.surfaces ?? {};
    for (const l of surf.lending ?? []) { add(l.source); for (const p of l.openPositions ?? []) { add(p.market); add(p.token); } }
    for (const p of surf.dex?.lpPositions ?? []) p.pair.split("/").forEach(add);
    for (const w of surf.approvals?.items ?? []) { add(w.symbol); add(w.tokenSymbol); }
    for (const m of surf.incidents?.matches ?? []) add(m.target);
    return this.active().filter(a => {
      const hay = `${a.protocol} ${a.pair}`.toLowerCase();
      return [...exposure].some(e => e.length >= 3 && (hay.includes(e) || e.includes(a.pair.toLowerCase())));
    });
  }
}

// --- live source: poll the Uniswap subgraph for the largest pools' TVL ---
const UNI = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
export async function pollTopPools(gql, apiKey, first = 40) {
  const d = await gql(apiKey, UNI, `{
    pools(first: ${first}, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id totalValueLockedUSD token0 { symbol } token1 { symbol }
    }
  }`);
  return (d.pools ?? []).map(p => ({
    poolId: p.id, protocol: `Uniswap v3 ${p.token0.symbol}/${p.token1.symbol}`,
    pair: `${p.token0.symbol}/${p.token1.symbol}`, tvlUSD: Number(p.totalValueLockedUSD),
  }));
}

// --- demo replay: a real-shaped drain timeline, time-compressed, tagged replay:true ---
// Models a pool collapsing from healthy TVL to near-zero over ~9 minutes — the shape of
// an exploit drain. Fires the alarm on camera with no waiting for a live event.
export function replayDrain(engine, { poolId = "0xREPLAY-dogvault", protocol = "DogVault Stablecoin Pool", pair = "USDC/DOG", startTvl = 5_200_000, stepMs = 700, onStep } = {}) {
  const curve = [1.0, 0.99, 0.98, 0.965, 0.90, 0.72, 0.45, 0.22, 0.08, 0.02]; // healthy → drained
  let i = 0;
  const base = engine.now();
  const tick = () => {
    if (i >= curve.length) return;
    const tvlUSD = Math.round(startTvl * curve[i]);
    const ts = base + i * WINDOW_MS / curve.length; // spread across the window so the drop registers
    const alarm = engine.observe({ poolId, protocol, pair, tvlUSD, ts, replay: true });
    if (onStep) onStep({ step: i, tvlUSD, alarm });
    i++;
    if (i < curve.length) setTimeout(tick, stepMs);
  };
  tick();
  return { poolId, steps: curve.length, etaMs: curve.length * stepMs };
}
