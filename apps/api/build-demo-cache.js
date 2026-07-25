// build-demo-cache — pre-computes full scan reports for the demo wallets and writes
// demo-cache.json next to server.js. The server pins these (no TTL): a live demo
// answers in milliseconds instead of waiting on a 7-chain approvals trace.
// Run ON the API host (GRAPH_API_KEY lives there):
//   GRAPH_API_KEY=… node build-demo-cache.js [0xaddr|name.eth …]
// With no args it builds every wallet in demo-wallets.json. Re-run any time the
// scoring changes (the server ignores a stale-schema file) or before a demo.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { autopsy, loadIncidents } from "./autopsy.js";
import { resolveAddress, multichainApprovals } from "./onchain.js";

const SCHEMA = 8; // MUST match server.js — the server refuses a mismatched file
const KEY = process.env.GRAPH_API_KEY;
if (!KEY) { console.error("GRAPH_API_KEY missing"); process.exit(1); }

const REGISTRY = JSON.parse(readFileSync(new URL("./incidents.json", import.meta.url), "utf8"));
loadIncidents(REGISTRY);

const inputs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : JSON.parse(readFileSync(new URL("./demo-wallets.json", import.meta.url), "utf8")).wallets;

const keyOf = addr => createHash("sha256").update(addr).digest("hex");
const out = { schema: SCHEMA, builtAt: new Date().toISOString(), wallets: [], entries: {} };

for (const input of inputs) {
  const t0 = Date.now();
  const resolved = await resolveAddress(input);
  process.stdout.write(`${input} -> ${resolved} … `);
  const report = await autopsy(KEY, resolved, {
    approvals: addr => multichainApprovals(addr, REGISTRY, { perChainMs: 1800000 }), // patient: build-time, not request-time — a heavy mainnet history legitimately runs >10 min
  });
  report.input = input; report.resolved = resolved;
  if (report.cooked.partial) {
    console.log(`PARTIAL (pending: ${report.cooked.pendingFeeds.join(",")}) — NOT stored, fix the feed and re-run`);
    continue;
  }
  const skipped = report.surfaces.approvals.skipped ?? [];
  if (skipped.length && !process.env.ALLOW_SKIPPED) {
    console.log(`INCOMPLETE (skipped: ${skipped.join(",")}) — NOT stored. A pinned demo report must cover every chain; re-run, or ALLOW_SKIPPED=1 to override.`);
    continue;
  }
  out.entries[keyOf(resolved.toLowerCase())] = report;
  out.wallets.push(input);
  console.log(`${report.cooked.score}/100 ${report.cooked.band} · ${report.surfaces.approvals.counts.total} wounds · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

writeFileSync(new URL("./demo-cache.json", import.meta.url), JSON.stringify(out));
console.log(`demo-cache.json written: ${out.wallets.length}/${inputs.length} wallets, schema ${SCHEMA}`);
process.exit(0); // the per-chain race timers would otherwise keep the process alive for minutes
