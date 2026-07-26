# cooked-skill — install & use (The Graph AI Tooling)

**What it is:** an MCP server that gives any AI client one tool set —
*address in → cross-protocol wallet-risk profile out* — powered by live data from The
Graph gateway (Messari standardized subgraphs). One config block and your agent can
answer "is this wallet dangerous?" without you writing a single subgraph query.

Everything lives in [`cooked-skill/`](cooked-skill/).

---

## 1. Prerequisites

- **Node.js ≥ 20**
- **A Graph gateway API key** — create one free at
  <https://thegraph.com/studio/apikeys/>. (This is the only credential; it stays in
  your environment, never in a prompt.)

## 2. Install

```bash
cd cooked-skill
npm install
```

## 3. Verify it works (offline + live)

```bash
npm test                                   # offline tests (mocked gateway) — should pass
GRAPH_API_KEY=<your-key> npm start         # starts the MCP server on stdio
```
You should see: `[cooked] up · 5 tools on stdio · key=set`.

## 4. Mount it in your AI client

### Claude Desktop / Claude Code / Cursor (MCP config)
Add this to your MCP config (`claude_desktop_config.json`, `.mcp.json`, or the
equivalent), pointing `args` at the absolute path of `cooked-skill/src/index.js`:

```json
{
  "mcpServers": {
    "cooked": {
      "command": "node",
      "args": ["/absolute/path/to/TheGraph/cooked-skill/src/index.js"],
      "env": { "GRAPH_API_KEY": "your-graph-gateway-key" }
    }
  }
}
```
Restart the client. Run `/mcp` (or your client's MCP list) — you should see
**cooked · 5 tools**.

### Any other MCP client
It speaks standard MCP over stdio — launch `node src/index.js` with `GRAPH_API_KEY`
set and connect your client to its stdio.

## 5. Use it

Just ask your agent in plain language:

> "Is `vitalik.eth` exposed to any DeFi lending risk? Check it live."

The agent calls **`cooked_lending_surface`** (or `cooked_autopsy` for the full
profile) and gets live Aave v3 / Compound v3 / Spark / Uniswap v3 data back — no
mocks, straight from the gateway.

## The 5 tools

| tool | what it returns |
|---|---|
| `cooked_autopsy` | full cross-protocol risk profile + cooked score |
| `cooked_lending_surface` | Aave v3 · Compound v3 · Spark positions/TVL (one standardized query) |
| `cooked_dex_surface` | Uniswap v3 LP positions + recent swaps |
| `cooked_incident_check` | wallet's universe cross-referenced vs the 172-incident registry |
| `cooked_sources` | which subgraphs/endpoints are wired |

## Troubleshooting

- **`GRAPH_API_KEY missing`** → set it in the MCP config `env` (or the shell before `npm start`).
- **Tools not showing** → check the `args` path is absolute and `npm install` ran inside `cooked-skill/`.
- **Empty results** → the wallet may simply have no positions on those protocols; try `cooked_autopsy` for the full picture.

## How The Graph is used

One Messari **standardized** subgraph schema lets a single query pattern cover Aave v3,
Compound v3 and Spark — adding a conforming protocol is one line in `src/autopsy.js`.
Uniswap v3 rides the same registry as a second dialect. All data is fetched live from
the Graph gateway at call time. See `cooked-skill/SKILL.md` for the tool contract.
