// card — the shareable verdict banner (1200×630 OG image, composed as SVG and
// rasterized by sharp in server.js) plus the /r/<addr> share-page HTML whose meta
// tags give X/Telegram/Discord a rich preview. Everything chain-derived is escaped.

export const escXml = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const BAND_COLORS = {
  "RARE": "#7BA886", "MEDIUM RARE": "#DFA575", "MEDIUM WELL": "#FF6A2B",
  "COOKED": "#D6472F", "CHARCOAL": "#FF3B1F",
};

// Needle angle across the half-dial: 0 → -90°, 100 → +90°.
const needleAngle = score => -90 + Math.max(0, Math.min(100, score)) * 1.8;

export function cardSVG({ name, score, band, statLine, pending = false }) {
  const bandColor = BAND_COLORS[band] ?? "#FF6A2B";
  const title = pending ? "STILL COOKING…" : `${score}% · ${band}`;
  const sub = pending
    ? "this wallet's autopsy is still on the stove — tap through to watch it cook"
    : statLine;
  // two-line word-boundary wrap for the stat line
  const lines = ["", ""];
  let li = 0;
  for (const w of String(sub).split(" ")) {
    if ((lines[li] + " " + w).trim().length > 46) { if (li === 1) break; li = 1; }
    lines[li] = (lines[li] + " " + w).trim();
  }
  const arc = (from, to, color) => {
    const a0 = (from - 180) * Math.PI / 180, a1 = (to - 180) * Math.PI / 180, R = 150, cx = 950, cy = 400;
    return `<path d="M ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}" stroke="${color}" stroke-width="26" fill="none" stroke-linecap="butt"/>`;
  };
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="80%" cy="70%" r="70%">
      <stop offset="0%" stop-color="#2a1408"/><stop offset="100%" stop-color="#0D0A07"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="1200" height="630" fill="none" stroke="#3A2E23" stroke-width="2"/>
  <text x="70" y="92" font-family="Menlo,monospace" font-size="22" letter-spacing="4" fill="#A6937D">AUTOPSY REPORT · SEALED IN A 0G TEE</text>
  <text x="70" y="132" font-family="Menlo,monospace" font-size="26" fill="#EAE0CE">${escXml(name)}</text>
  <text x="62" y="315" font-family="-apple-system,Arial,sans-serif" font-weight="900" font-size="150" fill="#EAE0CE">${pending ? "· · ·" : escXml(score) + "%"}</text>
  <g transform="rotate(-3 70 380)">
    <rect x="66" y="342" width="${34 + String(title).length * 26}" height="64" rx="8" fill="none" stroke="${bandColor}" stroke-width="5"/>
    <text x="86" y="388" font-family="-apple-system,Arial,sans-serif" font-weight="900" font-size="42" fill="${bandColor}">${escXml(title)}</text>
  </g>
  <text x="70" y="470" font-family="Georgia,serif" font-style="italic" font-size="30" fill="#EAE0CE">${escXml(lines[0])}</text>
  <text x="70" y="510" font-family="Georgia,serif" font-style="italic" font-size="30" fill="#EAE0CE">${escXml(lines[1])}</text>
  ${arc(0, 36, "#EFE3CE")}${arc(36, 72, "#DFA575")}${arc(72, 108, "#A9713C")}${arc(108, 144, "#5C3A22")}${arc(144, 180, "#2a1d14")}
  <g transform="rotate(${pending ? -90 : needleAngle(score)} 950 400)">
    <line x1="950" y1="400" x2="950" y2="272" stroke="#FF6A2B" stroke-width="10" stroke-linecap="round"/>
  </g>
  <circle cx="950" cy="400" r="16" fill="#FF6A2B"/>
  <text x="950" y="502" text-anchor="middle" font-family="-apple-system,Arial,sans-serif" font-weight="900" font-size="34" fill="#EAE0CE">AM I <tspan fill="#FF6A2B">COOKED?</tspan></text>
  <text x="950" y="536" text-anchor="middle" font-family="Menlo,monospace" font-size="16" letter-spacing="2" fill="#A6937D">THE GRAPH · 21 CHAINS · 0G · WORLD</text>
  <text x="70" y="576" font-family="Menlo,monospace" font-size="20" letter-spacing="2" fill="#FFD23F">tracely.live/cooked</text>
  <text x="1130" y="576" text-anchor="end" font-family="Menlo,monospace" font-size="18" fill="#A6937D">no connect · no signatures</text>
</svg>`;
}

export function sharePageHTML({ base, name, resolved, score, band, statLine, pending }) {
  const title = pending
    ? `${name} is being scanned — Am I Cooked?`
    : `${name} is ${score}% ${band} — Am I Cooked?`;
  const desc = pending
    ? "60-second wallet autopsy: The Graph + 21 EVM chains, verdict sealed in a 0G TEE."
    : `${statLine} · verdict sealed in a 0G TEE`;
  const img = `${base}/cooked-api/card?address=${encodeURIComponent(resolved)}`;
  const app = `${base}/cooked/?a=${encodeURIComponent(resolved)}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${escXml(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta property="og:type" content="website">
<meta property="og:title" content="${escXml(title)}">
<meta property="og:description" content="${escXml(desc)}">
<meta property="og:image" content="${escXml(img)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="${escXml(base)}/cooked/r/${escXml(encodeURIComponent(resolved))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escXml(title)}">
<meta name="twitter:description" content="${escXml(desc)}">
<meta name="twitter:image" content="${escXml(img)}">
<meta http-equiv="refresh" content="0.4;url=${escXml(app)}">
<style>body{background:#0D0A07;color:#EAE0CE;font-family:Menlo,monospace;display:flex;align-items:center;justify-content:center;min-height:100vh}</style>
</head><body><p>opening the autopsy… <a href="${escXml(app)}" style="color:#FF6A2B">tap here if nothing happens</a></p></body></html>`;
}
