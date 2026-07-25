# Problems we found & solved — per sponsor

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
