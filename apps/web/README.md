# apps/web — AM I COOKED?

The app shell (prototype v7: 4 screens, animated, installable PWA).
Live demo: https://tracely.live/cooked/

Planned data wiring:
- `lib/autopsy` — standardized-schema queries via The Graph gateway (client-side)
- Judge, memory and registry calls via the SEAL MCP package (`packages/seal`)
- World MiniKit for Selfie Check / Identity Check and transaction signing

Deploy note: when redeploying, bump `V = 'cooked-vN'` in `sw.js` — installed PWAs
keep serving the cached build otherwise.

Test: `app.test.js` (Playwright) — 27 assertions covering the full flow against the
live URL, including authority gating, score outcomes, layout and error checks.
