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
| `cooked_autopsy` | `address` | Full report: lending + DEX surfaces, `generatedAt`, pending feeds flagged |
| `cooked_lending_surface` | `address` | Per-protocol open positions via ONE standardized Messari query |
| `cooked_dex_surface` | `address` | Uniswap v3 LP positions + recent swap flow |
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
- `approvals` / `incidents` surfaces report `pending-feed` until their feeds land — say so
  rather than implying full coverage.
- Coverage extension: any Messari-conforming lending subgraph is ONE line in `REGISTRY`
  (`src/autopsy.js`) — no new query code.
