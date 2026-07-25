# Why this needed to exist — the problems, globally

*Part 1: the real-world problem each sponsor's tech was NECESSARY to solve.
Part 2 (below): concrete gaps we hit in the stacks and fixed along the way.*

## The master problem

Billions are stolen from wallets every year — and the biggest share isn't stolen
keys. It's **permissions people granted and forgot**. You approve unlimited spending
"just once" to swap a token; months later that contract is exploited, and it can
drain you TODAY with no signature, while your balance looks perfectly fine. Nobody's
wallet UI shows this. Explorers show raw logs. Revoke tools show a table with no
diagnosis. Checkers log the address you paste. And everything is a post-mortem —
by the time you read about the hack, your window to act is gone.

Four sub-problems, four pillars:

## 1 · You can't see the danger — the DATA problem → The Graph

Your risk lives scattered across every lending market, DEX and pool you ever
touched — dozens of protocols, dozens of custom APIs. Integrating them one by one is
why every wallet checker covers two protocols and dies. **We needed The Graph's
standardized schemas** to make TOTAL coverage feasible: one query shape across every
conforming protocol, live. Solved: a full cross-protocol autopsy in ~10 seconds —
exploit exposure, forgotten money, live wounds — that was economically impossible
to build protocol-by-protocol.

## 2 · You can't trust the verdict — the TRUST problem → 0G

Say a website scores your wallet 92% at risk. Why believe it? It could be wrong,
could quietly change its rules, could be farming the addresses people paste. A risk
score you can't verify is just content. **We needed 0G** to make the verdict
self-proving: judged inside a TEE, rules hash-committed on-chain before launch,
every verdict attested in a registry — and the scan cached only by a hash of your
address. Solved: the first wallet checker where you don't trust the score — you
tap the seal and verify it, and it provably never kept your address.

## 3 · Knowing isn't fixing — the ACTION problem → World

People don't revoke. It's tedious, technical, and scary — and the obvious fix, "let
an AI do it," is the scariest thing in crypto: an autonomous agent with power over
funds IS the attack vector. **We needed World** to make automation safe to accept:
the Surgeon may only act while a verified human stands behind it (AgentBook), its
authority decays without daily liveness (Selfie Check), and it never signs — it
prepares the exact revoke and YOU sign. Solved: the first revoke agent a rational
person can say yes to, because its power has a human-shaped off switch.

## 4 · Help arrives after the funeral — the TIME problem → the Guardian

Drains take minutes; news takes hours. A protocol you're exposed to starts bleeding
liquidity and every existing tool tells you tomorrow. **We needed a live feed** (The
Graph's pool TVL, Substreams-ready) to close the gap: the guardian watches outflows
in real time and fires a siren pointing at YOUR revocable approvals while there's
still a window. Solved: the checker stops being a coroner and becomes a smoke
detector.

---

# Part 2 · Gaps we hit in the stacks & fixed — per sponsor

*The "we hit a real wall in your stack, built the fix, and you can take it upstream"
list. Every item is reproducible from this repo — use these in the feedback fields
and say them out loud in judging.*

---

## The Graph — the N-integrations problem, killed

**The problem every builder has:** a wallet-risk product needs data from every
lending market and DEX a wallet ever touched. The default is one custom integration
per protocol — the reason most "wallet checkers" cover two protocols and die.

**What we did:** proved the standardized-schema promise end-to-end. One
Messari-standard query serves Aave v3, Compound v3 and Spark; our whole integration
is a four-line registry (`apps/api/autopsy.js:20`) and protocol #4 is one line. Then
we packaged the result as **cooked-skill** — an MCP server that gives ANY agent
(Claude, Cursor, ChatGPT) "address in → risk profile out" with one config block.

**Take it upstream:** cooked-skill is a working reference for "standardized subgraphs
behind an agent interface" — link it from the standardized-subgraphs docs and every
AI builder gets a wallet-risk primitive for free.

---

## 0G — making a 7B TEE model produce verifiable verdicts

**The problem:** TEE inference gives you *private* compute, but an LLM's output is
still an LLM's output — a 7B model cannot be trusted to do exact weighted-rubric
arithmetic, and a "sealed" wrong answer is worse than no seal. Nothing in the docs
tells you how to get *deterministically checkable* results out of TEE chat models.

**What we did:** the reference-verdict pattern. We compute the rubric math
deterministically, hand the TEE model the reference alongside the raw surfaces, and
gate its output through `parseVerdict` — which recomputes the weighted score and
REJECTS anything off-rubric. The model contributes judgment and language; the math
cannot drift; the seal only ever anchors a verdict that verifies.
(`apps/api/sealjudge.js` + `judge.js:74`.)

**Also found along the way:**
- Attestation semantics need care: an unkeyed MAC proves record *integrity*, not TEE
  origin — our `seal_verify` reports `valid` only when a TEE signature was checked at
  response time, and says so explicitly. Worth stating this distinction in the SDK docs.
- The inference ledger needs the 3 OG network minimum on Galileo — the number worth
  printing in the quickstart, we found it by the deposit failing.
- Our stub backend emits self-consistent fake attestations that the verifier
  genuinely validates and rejects when tampered — a dev-mode pattern the SDK could
  ship, since it let us build the entire product offline and flip to live unchanged.

**Take it upstream:** the reference-verdict + verify-gate pattern is a copy-paste
recipe for "verifiable LLM scoring in a TEE" — a docs page away from being every
0G AI builder's starting point.

---

## World — the AgentKit path the docs didn't draw

**The problem:** we lost real hours to a wrong assumption the documentation invites:
that agent human-backing needs a World App ID and the classic IDKit orb-verify
widget. It doesn't. AgentKit human-backing is its own flow — register the agent's
wallet in AgentBook via the CLI, a human approves it in World App, and the backend
verifies standing with `createAgentBookVerifier()`. No App ID, no IDKit widget.
Meanwhile Selfie Check and Identity Check DO use the Developer Portal. Two adjacent
products, two different paths, one very confusable page.

**What we did:** shipped the full working reference: server-side AgentBook
verification that answers 402 until backing is real (`apps/api/surgeon.js`), the
authority ladder enforced twice (verify + at OPERATE-click), Selfie Check live
in-app via `worldVerify('selfie')`, and Identity Check with the two-boolean
data-minimization pattern. Plus the safety layer AgentKit implies but nobody writes
down: the agent prepares `approve(spender, 0)` and *never* signs.

**Take it upstream:** a "which World product do I need?" decision table at the top of
the AgentKit docs (backing ≠ verify widget ≠ portal checks) would have saved us half
a day — and our repo is the worked example for all three at once.

---

## Tenderly / RPC ecosystem — the batch cliff (bonus finding)

**The problem (fresh — reproducible today):** public gateways now hard-429 JSON-RPC
batches at sizes that worked last week (≥10 items under load). Any tool doing bulk
`eth_call` re-checks — allowance scanners, portfolio apps — silently loses data on
heavy wallets: our vitalik scan read "0 open approvals" instead of 2,166.

**What we did:** replaced fat JSON-RPC batches with Multicall3 `tryAggregate`
(hand-encoded, ~300 calls per single `eth_call`, per-item revert isolation) plus
quota-aware exponential backoff that treats -32005 as a wait-signal, not an error.
One change: 0 wounds → the true 2,166. (`apps/web/lib/approvals.js`.)

**Take it upstream:** worth a note in gateway docs ("batch limits; prefer Multicall3
for bulk reads") — and our encoder is dependency-free, liftable as-is.
