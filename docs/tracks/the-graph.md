# The Graph — track submissions

*Copy-paste-ready per track. Every claim below is checkable in this repo — judges diff
public repos, so we sell hard with things that are literally true.*

---

## 🏆 Best AI Tooling — cooked-skill: the wallet-risk MCP

**One line: address in → cross-protocol risk profile out. For every agent, not just ours.**

We ripped the intelligence out of our app and shipped it as reusable infrastructure:
**`cooked-skill`**, an MCP server any AI environment (Claude, Cursor, ChatGPT) can mount.
Your agent asks *"is this wallet in danger?"* and gets back a structured cross-protocol
risk profile — lending exposure, DEX history, incident matches against 177 real
exploits, a weighted cooked-score — all from **live Graph gateway data**.

**The whole integration is one config block:**

```json
{ "mcpServers": { "cooked": {
    "command": "node", "args": ["packages/cooked-skill/src/index.js"],
    "env": { "GRAPH_API_KEY": "<your-gateway-key>" } } } }
```

**Five tools:** `cooked_autopsy` (full risk profile) · `cooked_lending_surface` ·
`cooked_dex_surface` · `cooked_incident_check` · `cooked_sources`. Offline-tested
(mocked gateway) *and* live-validated (Aave v3 $19.7B / Compound v3 / Spark TVL at
request time). `SKILL.md` + README document every tool.

**Why it scores:** *Usefulness to builders (30%)* — every wallet app, trading agent, and
safety bot needs exactly this check and nobody wants to build 4 subgraph integrations
for it. *Reusability (25%)* — zero-dependency isomorphic core, MCP standard, works in
any client. *Graph use (20%)* — the Messari standardized schemas ARE the product (see
the Composable section: adding a protocol is one line). *Bonus:* we ship a second MCP
server in the same repo (SEAL — 0G-as-MCP), because agent-mountable infra is how we
build everything.

---

## 🏆 Best AI Use Case — the agent that reads The Graph, then acts

**Our AI doesn't print query results. It scores you, seals the verdict in a TEE, alarms
you mid-drain, and proposes the transaction that saves you.**

**AM I COOKED?** is a wallet autopsy: paste any address or ENS and The Graph supplies
the entire diagnostic picture — lending positions (Aave/Compound/Spark, Messari
standardized schemas), DEX history (Uniswap v3), and the wallet's protocol universe
that we cross-reference against 177 real incidents. On top of that live data:

- a **sealed AI judge** (0G TEE) reasons over the surfaces and issues a rubric-gated
  verdict — anchored on-chain, verifiable mid-demo;
- a **guardian alarm** polls a second Graph feed (pool TVL) and fires when a protocol
  you're exposed to starts draining — *risk monitoring, personalized by your own scan*;
- a **human-backed Surgeon agent** (World AgentKit) turns the diagnosis into prepared
  revoke transactions the user signs.

**Load-bearing is literal:** without The Graph there is no lending surface, no DEX
surface, no exploit-exposure universe, no alarm feed — no product. Endpoints: Graph
gateway, subgraph IDs in `apps/api/autopsy.js:20`. Live at **tracely.live/cooked** —
scan `jaredfromsubway.eth` (the $7.5M dangling-approval victim: 47%, five open wounds).

**Why it scores:** *Effective Graph use (35%)* — four subgraphs + a composed live feed,
load-bearing. *Usefulness (25%)* — everyone runs it on their own wallet the moment they
see it. *Bonus criterion:* we also ship the reusable MCP (`cooked-skill`, above).

---

## 🏆 Best Composable / Standardized — one query shape, the whole DeFi map

**Adding a lending protocol to our scanner is one line. That's the standardized-schema
pitch, and we can show it live.**

```js
// apps/api/autopsy.js — this list IS the integration
{ name: "Aave v3 Ethereum",     schema: "messari-lending", id: "JCNWRypm…" },
{ name: "Compound v3 Ethereum", schema: "messari-lending", id: "AwoxEZbi…" },
{ name: "Spark Lend Ethereum",  schema: "messari-lending", id: "GbKdmBe4…" },  // ← one line = one protocol
```

Because Messari **Standardized Subgraphs** share one schema, we wrote our lending query
**once** and fan it across every conforming protocol — same `positions`, same `market`,
same shapes. Uniswap v3 rides beside them as a second dialect in the same registry.
**What became easier:** three protocol integrations became one afternoon and one query;
protocol #4 is a config line, not a sprint.

**Composition:** the autopsy composes with a **second Graph product** — a live pool-TVL
feed driving our guardian alarm engine (`apps/api/alarm.js`): TVL samples in, drain
alarms out, personalized against the wallet's own scan surfaces. The engine is
source-agnostic by design — a composed Substreams `.spkg` sink drops in without
touching detection.

**Why it scores:** *Standards leverage (35%)* — the one-line-per-protocol registry is
the demo. *Breadth (20%)* — lending × 3 + DEX + live-feed composition, all gateway-live,
zero mocks. *Demo (10%)* — we show the query hitting three protocols, then add a
protocol on camera by pasting one line.

---

### Universal footer (all three submissions)
- Live: **https://tracely.live/cooked/** · Repo: **github.com/vsnation/Am-I-Cooked**
- Graph usage: gateway + Messari standardized subgraphs (Aave v3 `JCNWRypm…`,
  Compound v3 `AwoxEZbi…`, Spark `GbKdmBe4…`), Uniswap v3 `5zvR82Qo…`, live pool-TVL
  feed for the alarm. No mocks anywhere in the request path.
- MCP/SKILL: `packages/cooked-skill/` (SKILL.md, 5 tools, offline tests + live validation).
