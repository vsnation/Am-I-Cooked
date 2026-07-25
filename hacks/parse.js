// Parse hacks/incidents.md (curated markdown tables) into hacks/incidents.json —
// the machine-readable registry the autopsy engine matches wallets against.
// Usage: node hacks/parse.js   (idempotent; commit the regenerated json)
import { readFileSync, writeFileSync } from "node:fs";

const md = readFileSync(new URL("./incidents.md", import.meta.url), "utf8");

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const money = s => {
  const m = /^\$([\d.]+)([MK]?)/.exec(s.trim());
  if (!m) return 0;
  return Math.round(Number(m[1]) * (m[2] === "M" ? 1e6 : m[2] === "K" ? 1e3 : 1));
};

// token-symbol aliases for major incidents — wallets speak in symbols, not protocol names
const ALIASES = {
  "Curve (Vyper)": ["crv"], "Balancer V2": ["bal"], "GMX": ["gmx", "glp"],
  "Gala Games": ["gala"], "pGALA": ["gala"], "Mango Markets": ["mngo"],
  "PlayDapp": ["pla"], "Truebit": ["tru"], "Maiar DEX (MultiversX)": ["egld"],
  "KyberSwap": ["knc"], "Euler Finance": ["eul"], "Beanstalk": ["bean"],
  "BadgerDAO": ["badger"], "Cream Finance I": ["cream"], "Cream Finance II": ["cream"],
  "PancakeBunny": ["bunny"], "Harvest Finance": ["farm"], "Wormhole": ["w"],
  "Ankr": ["ankr", "abnbc"], "SafeMoon": ["sfm"], "Olympus DAO": ["ohm"],
  "Radiant Capital": ["rdnt"], "Multichain": ["multi"], "Abracadabra": ["mim", "spell"],
  "Abracadabra Money": ["mim", "spell"], "1inch (Fusion)": ["1inch"],
  "THORChain": ["rune"], "Bittensor": ["tao"], "LI.FI": ["lifi"],
};

const incidents = [];
let inYear = false;
for (const line of md.split("\n")) {
  if (/^## \d{4}$/.test(line)) { inYear = true; continue; }
  if (/^## /.test(line)) { inYear = false; continue; }
  if (!inYear || !line.startsWith("|") || /^\|\s*(Date|---)/.test(line)) continue;
  const c = line.split("|").map(s => s.trim());
  if (c.length < 8 || !c[1]) continue;
  const [, date, target, usd, type, bridge, recovered, vector] = c;
  const dm = /^(\w{3}) (\d{4})$/.exec(date);
  incidents.push({
    target,
    date,
    year: dm ? Number(dm[2]) : null,
    month: dm ? MONTHS[dm[1]] ?? null : null,
    lostUSD: money(usd),
    type,
    bridge: bridge === "yes",
    recovered: recovered.replace(" ✓", ""),
    vector,
    // normalized match keys: full name + distinctive words ≥4 chars (avoids "the", "dao" noise)
    matchKeys: [target.toLowerCase(), ...(ALIASES[target] ?? []), ...target.toLowerCase()
      .replace(/[()./]/g, " ").split(/\s+/)
      .filter(w => w.length >= 4 && !["finance", "protocol", "network", "bridge", "capital", "markets", "money", "games", "wallet", "token", "lend"].includes(w))],
  });
}

// verified addresses table
const addresses = [];
const addrSection = md.split("## Verified addresses")[1] ?? "";
for (const line of addrSection.split("\n")) {
  if (!line.startsWith("|") || /^\|\s*(Target|---)/.test(line)) continue;
  const c = line.split("|").map(s => s.trim());
  if (c.length < 6 || !c[1]) continue;
  addresses.push({ target: c[1], chain: c[2], kind: c[3], address: c[4].replace(/`/g, "").toLowerCase() });
}

const out = { generated: "hacks/parse.js", incidentCount: incidents.length, addressCount: addresses.length, incidents, addresses };
writeFileSync(new URL("./incidents.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(`parsed ${incidents.length} incidents, ${addresses.length} addresses → hacks/incidents.json`);
