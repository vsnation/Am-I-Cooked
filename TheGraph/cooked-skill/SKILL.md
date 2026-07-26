---
name: cooked-skill
description: Cross-protocol wallet risk autopsy — give it an EVM address, get live lending positions (Aave v3, Compound v3, Spark via Messari standardized schemas) and DEX exposure (Uniswap v3 LPs + recent swaps) from The Graph gateway. Use when asked about a wallet's DeFi exposure, positions, or "am I cooked?".
---

# cooked-skill

Address in → cross-protocol risk profile out. Zero mocks: every number is fetched live
from The Graph gateway at call time.

## Requirements

- `GRAPH_API_KEY` in the environment (create one at https://thegraph.com/studio/apikeys/).
  Never pass the key as a tool argument or echo it into output.

## Tools (via MCP server `cooked-skill`)

| Tool | Input | Returns |
|---|---|---|
| `cooked_autopsy` | `address` | Full report: lending + DEX + incident exposure + ghost + behavioral surfaces, partial `cooked` score with band |
| `cooked_lending_surface` | `address` | Per-protocol open positions via ONE standardized Messari query |
| `cooked_dex_surface` | `address` | Uniswap v3 LP positions + recent swap flow |
| `cooked_incident_check` | `terms[]` | Names/symbols cross-referenced against the 172-incident registry (no API key needed) |
| `cooked_sources` | — | The subgraph registry being scanned |

## Direct library use (no MCP client)

```js
import { autopsy } from "cooked-skill/src/autopsy.js";
const report = await autopsy(process.env.GRAPH_API_KEY, "0xd8dA…6045");
```

## Interpreting results

- `lending[].openPositions[].side` — `COLLATERAL` vs `BORROWER`; borrow positions with no
  collateral on the same market are the risk signal.
- `dex.recentSwaps` is ordered newest-first; timestamps are unix seconds.
- `incidents.matches` is name/symbol-level matching (address-level lands with the
  approvals feed); `ghost` = value parked where nothing lives; `behavioral` is a
  documented heuristic v0.
- `cooked` is a PARTIAL score (`partial: true`, `pendingFeeds` lists what's missing —
  approvals is 40% of the rubric). Present it as partial, never as the full verdict.
- Coverage extension: any Messari-conforming lending subgraph is ONE line in `REGISTRY`
  (`src/autopsy.js`) — no new query code.
