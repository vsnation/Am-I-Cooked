// cooked-api — scan service: runs the autopsy server-side (Graph API key stays here),
// caches results for instant repeat lookups. Cache: MongoDB when available, in-memory
// always (the service degrades gracefully, it never depends on Mongo being up).
import http from "node:http";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { autopsy, loadIncidents } from "./autopsy.js";
import { resolveAddress, multichainApprovals } from "./onchain.js";
import { AlarmEngine, pollTopPools, replayDrain } from "./alarm.js";
import { surgeonAuthorize, surgeonStatus, surgeonSelfCheck } from "./surgeon.js";
import { cardSVG, sharePageHTML } from "./card.js";
import { gql } from "./autopsy.js";

const PUBLIC_BASE = process.env.PUBLIC_BASE || "https://tracely.live";
// sharp rasterizes the share card; without it we degrade to SVG (browsers fine, X won't preview)
let sharp = null;
try { sharp = (await import("sharp")).default; }
catch { console.error("[cooked-api] sharp not installed — share cards served as SVG"); }

const PORT = Number(process.env.PORT || 7801);
const KEY = process.env.GRAPH_API_KEY;
const RPC_URL = process.env.ETH_RPC_URL || "https://rpc.mevblocker.io";
const MONGO_URL = process.env.MONGO_URL || "";
const TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000);
// A scan that lost chains is still worth serving briefly — refusing to cache it meant
// every retry of a heavy wallet re-ran 21 chains from scratch.
const PARTIAL_TTL_MS = Number(process.env.PARTIAL_CACHE_TTL_MS || 90 * 1000);
// A cold scan is 21 chains of log history on a paid Graph key. Unmetered, `fresh=1`
// turned that into a free amplifier for anyone with curl.
const RL_MAX = Number(process.env.SCAN_RATE_MAX || 12);
const RL_WINDOW_MS = Number(process.env.SCAN_RATE_WINDOW_MS || 60 * 1000);
const MAX_COLD_SCANS = Number(process.env.MAX_CONCURRENT_SCANS || 4);
const REPLAY_COOLDOWN_MS = Number(process.env.REPLAY_COOLDOWN_MS || 120 * 1000);
const ADMIN_TOKEN = process.env.COOKED_ADMIN_TOKEN || "";
const SCHEMA = 8;
const SELF_ORIGIN = process.env.SELF_ORIGIN || ("http://127.0.0.1:" + PORT); // bump to invalidate all cached reports after a scoring change
if (!KEY) { console.error("[cooked-api] GRAPH_API_KEY missing"); process.exit(1); }

// Availability over purity: a stray rejection from a provider SDK timer must log,
// not kill the service — a dead process is a 502 for every user until systemd notices.
process.on("unhandledRejection", e => console.error("[cooked-api] unhandledRejection:", e?.stack || e));
process.on("uncaughtException", e => console.error("[cooked-api] uncaughtException:", e?.stack || e));

const REGISTRY = JSON.parse(readFileSync(new URL("./incidents.json", import.meta.url), "utf8"));
loadIncidents(REGISTRY);
const DRAINERS = REGISTRY.addresses.map(a => a.address);
const approvalsProvider = (addr) => multichainApprovals(addr, REGISTRY, {});

// --- guardian: watch DeFi liquidity for large outflows ---
const alarms = new AlarmEngine();
async function pollAlarms() {
  try { for (const s of await pollTopPools(gql, KEY)) alarms.observe(s); }
  catch (e) { /* transient subgraph error — next tick retries */ }
}
setInterval(pollAlarms, 15000);
pollAlarms();

const mem = new Map(); // addr -> { at, report }
let col = null;
if (MONGO_URL) {
  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    col = client.db("cooked").collection("scans");
    // TTL indexes only act on BSON dates — the old index sat on `at` (a Number), so it
    // silently never expired anything and the collection grew without bound.
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await col.dropIndex("at_1").catch(() => {}); // remove the index that never worked
    console.log("[cooked-api] mongo cache connected");
  } catch (e) {
    console.error(`[cooked-api] mongo unavailable (${e.message}) — memory cache only`);
  }
}

let scans = 0, hits = 0;
const inflight = new Map(); // key -> Promise: coalesce concurrent scans of one address
const cardCache = new Map(); // key -> {at, buf, type}: rendered share banners
// Cache by a hash of the address, not the address itself — no plaintext ledger of who
// looked up what (public data either way, but nothing links a person to a lookup).
const keyOf = addr => createHash("sha256").update(addr).digest("hex");

// --- demo store: pre-built full reports for the demo wallets, pinned (no TTL) ---
// Built by build-demo-cache.js; served instantly so a live demo never waits on a
// 7-chain scan. Ignored when its schema is stale — rebuild after scoring changes.
const demoStore = new Map();
try {
  const d = JSON.parse(readFileSync(new URL("./demo-cache.json", import.meta.url), "utf8"));
  if (d.schema === SCHEMA) for (const [k, report] of Object.entries(d.entries)) demoStore.set(k, report);
  else console.error(`[cooked-api] demo-cache.json schema ${d.schema} != ${SCHEMA} — ignored, rebuild it`);
} catch { /* no demo cache built yet — fine */ }

const ttlFor = report => (report?.cooked?.partial ? PARTIAL_TTL_MS : TTL_MS);

async function getCached(addr) {
  const key = keyOf(addr);
  const m = mem.get(key);
  if (m && m.schema === SCHEMA && Date.now() - m.at < ttlFor(m.report)) return { ...m, layer: "memory" };
  if (col) {
    const d = await col.findOne({ _id: key }).catch(() => null);
    if (d && d.schema === SCHEMA && Date.now() - d.at < ttlFor(d.report)) { mem.set(key, { at: d.at, schema: SCHEMA, report: d.report }); return { ...d, layer: "mongo" }; }
  }
  return null;
}
async function putCached(addr, report) {
  // A feed that is entirely down is never cached; a scan that merely lost some chains is
  // cached briefly and stays flagged partial all the way to the UI.
  if (report?.cooked?.feedDown) return;
  const key = keyOf(addr);
  const at = Date.now();
  const doc = { at, schema: SCHEMA, report, expiresAt: new Date(at + ttlFor(report)) };
  mem.set(key, doc);
  if (mem.size > 500) mem.delete(mem.keys().next().value); // bound memory
  if (col) await col.updateOne({ _id: key }, { $set: doc }, { upsert: true }).catch(() => {});
}

// --- abuse control: the expensive routes are metered per caller ---
const buckets = new Map(); // ip -> recent request timestamps
function rateLimited(ip) {
  const now = Date.now();
  const hits = (buckets.get(ip) ?? []).filter(t => now - t < RL_WINDOW_MS);
  hits.push(now);
  buckets.set(ip, hits);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.some(t => now - t < RL_WINDOW_MS)) buckets.delete(k);
  return hits.length > RL_MAX;
}
// Behind the reverse proxy every socket is 127.0.0.1, so the forwarded chain is the only
// caller identity available; take the left-most entry the proxy set.
const clientIp = req =>
  String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()
  || req.socket.remoteAddress || "unknown";
const isAdmin = req => !!ADMIN_TOKEN && req.headers["x-cooked-admin"] === ADMIN_TOKEN;

// Full scan (with the slow multichain wounds). Coalesced so /scan and /scan/wounds ride
// the same in-flight run, and cached so repeats are instant.
function runFull(resolved, input, addr) {
  let p = inflight.get(addr);
  if (!p) {
    p = (async () => {
      const report = await autopsy(KEY, resolved, { approvals: approvalsProvider });
      report.input = input; report.resolved = resolved;
      await putCached(addr, report);
      return report;
    })().finally(() => inflight.delete(addr));
    inflight.set(addr, p);
  }
  return p;
}

let lastReplayAt = 0;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
  try {
    if (url.pathname === "/health") return send(200, { ok: true, scans, hits, mongo: !!col, memEntries: mem.size, demoEntries: demoStore.size, alarms: alarms.active().length });
    if (url.pathname === "/alarms") return send(200, { alarms: alarms.active() });
    if (url.pathname === "/alarms/for") {
      const input = (url.searchParams.get("address") || "").trim();
      let resolved; try { resolved = await resolveAddress(input); } catch (e) { return send(400, { error: e.message }); }
      const cached = await getCached(resolved.toLowerCase());
      if (!cached) return send(200, { alarms: [], note: "scan this address first" });
      return send(200, { alarms: alarms.forExposure(cached.report) });
    }
    if (url.pathname === "/alarms/replay") {
      // Public, and it writes into the alarm state every visitor reads. Keep the demo
      // button working, but one replay at a time — not one per request.
      if (!isAdmin(req) && Date.now() - lastReplayAt < REPLAY_COOLDOWN_MS)
        return send(429, { error: "replay on cooldown", retryAfterMs: REPLAY_COOLDOWN_MS - (Date.now() - lastReplayAt) });
      lastReplayAt = Date.now();
      const r = replayDrain(alarms);
      return send(200, { started: true, ...r });
    }
    // ---- shareable results: OG banner + share page (X/Telegram/Discord previews) ----
    if (url.pathname === "/card" || url.pathname.startsWith("/r/")) {
      const input = url.pathname === "/card"
        ? (url.searchParams.get("address") || "").trim()
        : decodeURIComponent(url.pathname.slice(3)).trim();
      let resolved;
      try { resolved = await resolveAddress(input); }
      catch (e) { return send(400, { error: e.message }); }
      const addr = resolved.toLowerCase(), key = keyOf(addr);
      const rep = demoStore.get(key) ?? (await getCached(addr))?.report ?? null;
      const name = rep?.input && /\.eth$/i.test(rep.input) ? rep.input : `${resolved.slice(0, 6)}…${resolved.slice(-4)}`;
      const facts = rep ? {
        name, score: rep.cooked.score, band: rep.cooked.band, pending: false,
        statLine: `${rep.surfaces.incidents.matches.length} drained protocols touched · ${rep.surfaces.approvals?.counts?.total ?? 0} live approvals still open`,
      } : { name, pending: true, statLine: "" };
      if (url.pathname === "/card") {
        const hit = cardCache.get(key);
        if (hit && Date.now() - hit.at < 600_000) { res.writeHead(200, { "content-type": hit.type, "cache-control": "public, max-age=600" }); return res.end(hit.buf); }
        const svg = cardSVG(facts);
        const out = sharp
          ? { buf: await sharp(Buffer.from(svg)).png().toBuffer(), type: "image/png" }
          : { buf: Buffer.from(svg), type: "image/svg+xml" };
        cardCache.set(key, { at: Date.now(), ...out });
        if (cardCache.size > 200) cardCache.delete(cardCache.keys().next().value);
        res.writeHead(200, { "content-type": out.type, "cache-control": "public, max-age=600" });
        return res.end(out.buf);
      }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" });
      return res.end(sharePageHTML({ base: PUBLIC_BASE, resolved, ...facts }));
    }
    if (url.pathname === "/surgeon/status") {
      const self = await surgeonSelfCheck(SELF_ORIGIN + "/surgeon/probe");
      return send(200, { ...surgeonStatus(), humanBacked: self.granted, check: self });
    }
    if (url.pathname === "/surgeon/probe") {
      const a = await surgeonAuthorize({ headers: req.headers, url: req.url });
      return send(a.granted ? 200 : 402, a);
    }
    if (url.pathname === "/surgeon/authorize") {
      const a = await surgeonAuthorize({ headers: req.headers, url: req.url });
      return send(200, a);
    }
    if (url.pathname === "/scan/wounds") {
      const input = (url.searchParams.get("address") || "").trim();
      let resolved; try { resolved = await resolveAddress(input); } catch (e) { return send(400, { error: e.message }); }
      const addr = resolved.toLowerCase();
      const pinned = demoStore.get(keyOf(addr));
      if (pinned) return send(200, { approvals: pinned.surfaces.approvals, cooked: pinned.cooked });
      const cached = await getCached(addr);
      if (!cached && rateLimited(clientIp(req))) return send(429, { error: `rate limit: ${RL_MAX} scans / ${RL_WINDOW_MS / 1000}s` });
      if (!cached && !inflight.has(addr) && inflight.size >= MAX_COLD_SCANS)
        return send(503, { error: "scanner saturated — retry shortly", running: inflight.size });
      const full = cached ? cached.report : await runFull(resolved, input, addr);
      return send(200, { approvals: full.surfaces.approvals, cooked: full.cooked });
    }
    if (url.pathname !== "/scan") return send(404, { error: "routes: /scan, /scan/wounds, /alarms, /surgeon/*, /health" });
    const input = (url.searchParams.get("address") || "").trim();
    let resolved;
    try { resolved = await resolveAddress(input); }
    catch (e) { return send(400, { error: e.message }); }
    const addr = resolved.toLowerCase();
    scans++;
    // `fresh` bypasses every cache layer, so it is the one knob that always costs money.
    // Operators keep it (rebuilds, debugging); the open internet does not.
    const fresh = url.searchParams.get("fresh") && isAdmin(req);
    const pinned = fresh ? null : demoStore.get(keyOf(addr));
    if (pinned) { hits++; return send(200, { cached: true, layer: "demo", report: pinned }); }
    const cached = fresh ? null : await getCached(addr);
    if (cached) { hits++; return send(200, { cached: true, layer: cached.layer, ageMs: Date.now() - cached.at, report: cached.report }); }
    if (rateLimited(clientIp(req))) return send(429, { error: `rate limit: ${RL_MAX} scans / ${RL_WINDOW_MS / 1000}s` });
    if (!inflight.has(addr) && inflight.size >= MAX_COLD_SCANS)
      return send(503, { error: "scanner saturated — retry shortly", running: inflight.size });
    if (url.searchParams.get("quick")) {
      // fast surfaces only (~1s); wounds (the slow 21-chain scan) come from /scan/wounds
      const report = await autopsy(KEY, resolved, {});
      report.input = input; report.resolved = resolved;
      runFull(resolved, input, addr).catch(() => {}); // warm the full result in the background
      return send(200, { cached: false, quick: true, report });
    }
    send(200, { cached: false, report: await runFull(resolved, input, addr) });
  } catch (e) {
    send(502, { error: e.message });
  }
});
server.listen(PORT, "127.0.0.1", () => console.log(`[cooked-api] on 127.0.0.1:${PORT} · mongo=${!!col}`));
