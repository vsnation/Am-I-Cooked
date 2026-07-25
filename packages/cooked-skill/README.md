# cooked-skill

Reusable SKILL/MCP tool: **address in → cross-protocol risk profile out**, built on
standardized (Messari) subgraph schemas via The Graph gateway. Extracted from
`apps/web/lib/autopsy.js` — extraction was packaging, not a rewrite.

- **MCP server** (`src/index.js`, stdio): `cooked_autopsy`, `cooked_lending_surface`,
  `cooked_dex_surface`, `cooked_sources` — usable from any generic MCP client.
- **Skill definition**: `SKILL.md` — drop into an agent's skills directory.
- **Library**: `src/autopsy.js`, zero dependencies, works in Node and the browser.

## Run

```bash
npm install
GRAPH_API_KEY=<studio key> npm start     # MCP server on stdio
npm test                                  # offline tests (mocked gateway)
```

Wire into an MCP client:

```json
{ "mcpServers": { "cooked": {
  "command": "node", "args": ["packages/cooked-skill/src/index.js"],
  "env": { "GRAPH_API_KEY": "<key>" } } } }
```

## Why standardized schemas matter

One Messari-standard query shape covers every conforming lending market — Aave v3,
Compound v3 and Spark are three registry lines, not three query dialects. That is what
makes a ~10-second cross-protocol autopsy feasible, and adding the next protocol a
one-line change.

## Note on the copy in `apps/web/lib/`

The PWA serves `apps/web/lib/autopsy.js` directly to the browser (no bundler), so the
file exists in both places by design. This package is the canonical home; keep the two
in sync when the registry grows.
