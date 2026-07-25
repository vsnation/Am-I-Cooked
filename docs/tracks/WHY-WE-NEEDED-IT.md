# Why we needed it — the dogfooding pitch, every track

*The strongest answer to "will anyone use this?" is "we already had to." Two beats
per track: why OUR product forced us to build it, and what it solves for everyone
after us. Every claim is repo-checkable.*

---

## The Graph — AI Use Case ($3k)

**Why we needed it:** a risk score nobody acts on is a number. Our users don't read
tables — they need something that *reasons* over their data and *does* something:
a judge that scores the surfaces, a guardian that watches their exposure, a surgeon
that prepares the fix. None of that exists without live, complete chain data — which
only The Graph could give us in a weekend.

**What it solves going forward:** the working pattern for "agent acts on live chain
data" — read standardized surfaces → reason (TEE-sealed) → act (prepared txs, human
signs). Lift the pattern for any trading agent, portfolio copilot or risk monitor.

## The Graph — Composable / Standardized ($3k)

**Why we needed it:** total coverage or the product lies. A wallet checker that
covers two protocols tells you you're safe while the third one drains you. We could
not afford one integration per protocol — the Messari standardized schema was the
ONLY route to full lending coverage in hackathon time: one query, every conforming
market, protocol #4 is a config line.

**What it solves going forward:** live proof the standards deliver their promise —
our registry file is the demo any team can copy the day they need cross-protocol
anything. Plus the composition blueprint: a second Graph product (pool-TVL feed)
plugged into the same engine turned a scanner into a smoke detector.

## The Graph — AI Tooling ($5k) · cooked-skill

**Why we needed it:** four of our own subsystems consume the same intelligence (web
API, TEE judge, alarm exposure-matching, demo builder) — so it became one
dependency-free library, then an MCP, because our own dev agents needed to scan
wallets mid-debugging. We are user #1, in production.

**What it solves going forward:** every AI agent that touches crypto eventually asks
"is this wallet dangerous?" — the trading bot, the wallet UI, the compliance tool
(our Tracely roadmap), the Discord safety bot. One config block, five tools, weeks
of plumbing deleted. The risk-profile primitive — geocoding for maps apps.

---

## 0G — Best AI Product ($6k)

**Why we needed it:** our product's core output is an accusation — "you are 92%
cooked." An unverifiable accusation is content, not a product. Worse: a wallet
checker is a natural address-harvesting honeypot, and we refused to be one. We
needed 0G to make the verdict self-proving (TEE judge, rubric hash-committed
on-chain, attested registry) and the scanner provably blind (hash-keyed cache,
history encrypted in 0G Storage). Trust wasn't a feature — it was the precondition
for the product existing.

**What it solves going forward:** the first wallet checker you don't have to trust —
tap the seal, open the transaction. "Verify, don't trust" applied to AI output,
end to end, in production.

## 0G — Infrastructure / SEAL ($4.5k)

**Why we needed it:** we needed 0G in FOUR places — judge inference, verdict memory,
registry calls, agent identity — and our core library must stay dependency-free and
isomorphic. Scattering SDK imports through the codebase was off the table. So: one
boundary. SEAL, an 8-tool MCP server, is the only thing in the repo that speaks 0G;
its stub mode emits self-consistent fake attestations the verifier genuinely
validates, which let us build the whole product offline and flip to live without
touching agent code.

**What it solves going forward:** 0G-as-MCP for any AI client — private inference,
encrypted memory, proofs, identity — one config line. And seal_verify is a trust
primitive: any agent can check any OTHER agent's attestation.

---

## World — AgentKit ($8k)

**Why we needed it:** the Surgeon is only useful if a rational person says yes to
it — and nobody sane accepts an unaccountable agent with power over funds; the
"helpful agent" IS crypto's current attack vector. We needed World's human-backing
ladder to make our own core feature adoptable: anonymous → diagnose only (server
402s), human-backed (AgentBook, World Chain) → may PROPOSE, and it never signs —
the human does. The blocked state isn't a limitation, it's the product.

**What it solves going forward:** the reference implementation for safe autonomous
financial authority — the question every agent platform faces next year, answered
with running code.

## World — Selfie Check ($1.75k)

**Why we needed it:** backing must be ALIVE, not a stale credential. A session token
that keeps knife-rights forever is just a second private key to steal. We needed
liveness-decayed authority: the Selfie Check renews daily, and a Surgeon whose human
stops showing up goes dormant — visibly, wounds reopening on screen.

**What it solves going forward:** the "authority decays without liveness" pattern —
the missing piece between "verified once" and "trusted forever" for any agent
holding delegated power.

## World — Identity Check ($1.75k)

**Why we needed it:** after a theft, your real options depend on jurisdiction and
age — but we're a privacy product (we don't even cache plaintext addresses), so
collecting identity to route recourse would betray our own thesis. We needed
eligibility WITHOUT identity: exactly two booleans — jurisdiction ✓, 18+ ✓ —
nothing else asked, nothing stored, and the routes derive from the wallet's own
scan.

**What it solves going forward:** the data-minimization template for compliance-ish
flows — prove the property, not the person. Regulators want exactly this shape.
