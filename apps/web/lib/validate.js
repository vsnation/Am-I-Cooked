// Data-path validation: run the real queries against the live gateway before any UI
// claims to show this data. Usage: node apps/web/lib/validate.js [address]
import { readFileSync } from "node:fs";
import { autopsy, loadIncidents } from "./autopsy.js";
loadIncidents(JSON.parse(readFileSync(new URL("../../../hacks/incidents.json", import.meta.url), "utf8")));

const env = Object.fromEntries(
  readFileSync(new URL("../../../.env", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
);
const key = env.GRAPH_API_KEY;
if (!key) { console.error("GRAPH_API_KEY missing from .env"); process.exit(1); }

const address = process.argv[2] ?? "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth
const t0 = Date.now();
const report = await autopsy(key, address);
const ms = Date.now() - t0;

const d = report.surfaces.dex;
console.log(`address        ${address}`);
for (const l of report.surfaces.lending)
  console.log(`lending        ${l.source} · protocol TVL $${Math.round(l.protocolTvlUSD).toLocaleString("en-US")} · account positions ${l.positionCount}`);
console.log(`dex            ${d.source} · LP positions ${d.lpPositions.length} · recent swaps ${d.recentSwaps.length}`);
if (d.recentSwaps[0]) console.log(`latest swap    ${d.recentSwaps[0].pair} $${Math.round(d.recentSwaps[0].amountUSD)} @ ${new Date(d.recentSwaps[0].ts * 1000).toISOString()}`);
const inc = report.surfaces.incidents;
console.log(`incidents      ${inc.matches.length} hacked-protocol brushes (registry: ${inc.registrySize})`);
for (const m of inc.matches.slice(0, 6))
  console.log(`  ⚠ ${m.target} (${m.date}) · $${(m.lostUSD / 1e6).toFixed(1)}M lost · matched on "${m.matchedOn}" · ${m.recovered}`);
const g = report.surfaces.ghost, b = report.surfaces.behavioral;
console.log(`ghost          ${g.items.length} dead-value signals${g.items[0] ? ` · e.g. ${g.items[0].where} (${g.items[0].why})` : ""}`);
if (b.worstDay) console.log(`worst day      ${b.worstDay.date} · $${b.worstDay.volumeUSD.toLocaleString("en-US")} moved · biggest ${b.worstDay.pair} $${b.worstDay.biggestSwapUSD.toLocaleString("en-US")}`);
console.log(`cooked         ${report.cooked.score} (${report.cooked.band}) · PARTIAL — pending: ${report.cooked.pendingFeeds.join(", ")}`);
console.log(`elapsed        ${ms}ms · all data live from gateway (no mocks)`);
