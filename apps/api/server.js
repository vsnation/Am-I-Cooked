// cooked-api — scan service: runs the autopsy server-side (Graph API key stays here),
// caches results for instant repeat lookups. Cache: MongoDB when available, in-memory
// always (the service degrades gracefully, it never depends on Mongo being up).
import http from "node:http";
import { readFileSync } from "node:fs";
import { autopsy, loadIncidents } from "./autopsy.js";
import { resolveAddress, approvalsSurface } from "./onchain.js";

const PORT = Number(process.env.PORT || 7801);
const KEY = process.env.GRAPH_API_KEY;
const RPC_URL = process.env.ETH_RPC_URL || "https://rpc.mevblocker.io";
const MONGO_URL = process.env.MONGO_URL || "";
const TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000);
const SCHEMA = 4; // bump to invalidate all cached reports after a scoring change
if (!KEY) { console.error("[cooked-api] GRAPH_API_KEY missing"); process.exit(1); }

const REGISTRY = JSON.parse(readFileSync(new URL("./incidents.json", import.meta.url), "utf8"));
loadIncidents(REGISTRY);
const DRAINERS = REGISTRY.addresses.map(a => a.address);
const approvalsProvider = (addr) => Promise.race([
  approvalsSurface(addr, DRAINERS, {}),
  new Promise((_, rej) => setTimeout(() => rej(new Error("approvals scan timed out")), 20000)),
]);

const mem = new Map(); // addr -> { at, report }
let col = null;
if (MONGO_URL) {
  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    col = client.db("cooked").collection("scans");
    await col.createIndex({ at: 1 });
    console.log("[cooked-api] mongo cache connected");
  } catch (e) {
    console.error(`[cooked-api] mongo unavailable (${e.message}) — memory cache only`);
  }
}

let scans = 0, hits = 0;
async function getCached(addr) {
  const m = mem.get(addr);
  if (m && m.schema === SCHEMA && Date.now() - m.at < TTL_MS) return { ...m, layer: "memory" };
  if (col) {
    const d = await col.findOne({ _id: addr }).catch(() => null);
    if (d && d.schema === SCHEMA && Date.now() - d.at < TTL_MS) { mem.set(addr, { at: d.at, schema: SCHEMA, report: d.report }); return { ...d, layer: "mongo" }; }
  }
  return null;
}
async function putCached(addr, report) {
  const doc = { at: Date.now(), schema: SCHEMA, report };
  mem.set(addr, doc);
  if (col) await col.updateOne({ _id: addr }, { $set: doc }, { upsert: true }).catch(() => {});
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
  try {
    if (url.pathname === "/health") return send(200, { ok: true, scans, hits, mongo: !!col, memEntries: mem.size });
    if (url.pathname !== "/scan") return send(404, { error: "routes: /scan?address=0x…, /health" });
    const input = (url.searchParams.get("address") || "").trim();
    let resolved;
    try { resolved = await resolveAddress(input); }
    catch (e) { return send(400, { error: e.message }); }
    const addr = resolved.toLowerCase();
    scans++;
    const cached = url.searchParams.get("fresh") ? null : await getCached(addr);
    if (cached) { hits++; return send(200, { cached: true, layer: cached.layer, ageMs: Date.now() - cached.at, report: cached.report }); }
    const report = await autopsy(KEY, resolved, { approvals: approvalsProvider });
    report.input = input; report.resolved = resolved;
    await putCached(addr, report);
    send(200, { cached: false, report });
  } catch (e) {
    send(502, { error: e.message });
  }
});
server.listen(PORT, "127.0.0.1", () => console.log(`[cooked-api] on 127.0.0.1:${PORT} · mongo=${!!col}`));
