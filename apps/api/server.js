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
import { gql } from "./autopsy.js";

const PORT = Number(process.env.PORT || 7801);
const KEY = process.env.GRAPH_API_KEY;
const RPC_URL = process.env.ETH_RPC_URL || "https://rpc.mevblocker.io";
const MONGO_URL = process.env.MONGO_URL || "";
const TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000);
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
    await col.createIndex({ at: 1 }, { expireAfterSeconds: 3600 }); // TTL: entries self-expire
    console.log("[cooked-api] mongo cache connected");
  } catch (e) {
    console.error(`[cooked-api] mongo unavailable (${e.message}) — memory cache only`);
  }
}

let scans = 0, hits = 0;
const inflight = new Map(); // key -> Promise: coalesce concurrent scans of one address
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

async function getCached(addr) {
  const key = keyOf(addr);
  const m = mem.get(key);
  if (m && m.schema === SCHEMA && Date.now() - m.at < TTL_MS) return { ...m, layer: "memory" };
  if (col) {
    const d = await col.findOne({ _id: key }).catch(() => null);
    if (d && d.schema === SCHEMA && Date.now() - d.at < TTL_MS) { mem.set(key, { at: d.at, schema: SCHEMA, report: d.report }); return { ...d, layer: "mongo" }; }
  }
  return null;
}
async function putCached(addr, report) {
  if (report?.cooked?.partial) return; // never cache a degraded scan as if complete
  const key = keyOf(addr);
  const doc = { at: Date.now(), schema: SCHEMA, report };
  mem.set(key, doc);
  if (mem.size > 500) mem.delete(mem.keys().next().value); // bound memory
  if (col) await col.updateOne({ _id: key }, { $set: doc }, { upsert: true }).catch(() => {});
}

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
    if (url.pathname === "/alarms/replay") { const r = replayDrain(alarms); return send(200, { started: true, ...r }); }
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
    const pinned = url.searchParams.get("fresh") ? null : demoStore.get(keyOf(addr));
    if (pinned) { hits++; return send(200, { cached: true, layer: "demo", report: pinned }); }
    const cached = url.searchParams.get("fresh") ? null : await getCached(addr);
    if (cached) { hits++; return send(200, { cached: true, layer: cached.layer, ageMs: Date.now() - cached.at, report: cached.report }); }
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
