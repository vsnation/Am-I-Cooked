# The Graph — AM I COOKED?

Everything for our Graph submissions in one place.

- **[`cooked-skill/`](cooked-skill/)** — the reusable MCP server / SKILL:
  *address in → cross-protocol wallet-risk profile out*, live from The Graph gateway.
- **[`SETUP.md`](SETUP.md)** — install it into Claude / Cursor / any MCP client and use it.

## What we built on The Graph

**One standardized query, the whole DeFi map.** Because Aave v3, Compound v3 and Spark
publish Messari **standardized** subgraph schemas, our entire lending integration is a
four-line registry (`cooked-skill/src/autopsy.js`) — adding a protocol is one line.
Uniswap v3 rides the same registry. It's all live gateway data, no mocks. And the app
composes a **second** Graph product (a live pool-TVL feed) into its drain alarm.

**The Graph is our backend** — without it we'd have to run our own indexer and a
database. The whole wallet autopsy is Graph data.

## Tracks

- **Best AI Tooling** — `cooked-skill`: one config block, five tools, any AI client. We're user #1 (our own app runs on it).
- **Best AI Use Case** — the agent reasons over the Graph surfaces and acts (revokes) on them; load-bearing, live.
- **Best Composable / Standardized** — one standardized query across three lending protocols + a composed second Graph product.

## Links
- Live app: <https://tracely.live/cooked/>
- Repo: <https://github.com/vsnation/Am-I-Cooked>
- Graph key: <https://thegraph.com/studio/apikeys/>
