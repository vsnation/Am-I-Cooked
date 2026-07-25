# World — track submissions

*The hard problem World solves for us: an AI agent that can revoke and move funds is
exactly what users fear. World is how we make our own core feature — an agent that
fixes your wallet — safe enough to say yes to.*

Live: **https://tracely.live/cooked/** · Repo: **github.com/vsnation/Am-I-Cooked**
Surgeon agent wallet (AgentBook, World Chain): `0x00ecc9545f23e59Ee4121F246c4eC4e26eA5657A`

---

## 🏆 AgentKit — New Use Cases ($8,000)

**An agent with the power to move your money — and a human-shaped off switch.**

The Surgeon diagnoses every dangerous approval and prepares the exact transaction to
cancel it. But its authority is a **ladder enforced server-side**, not a UI flourish:

- **Anonymous / unregistered agent → diagnose only.** Zero signing authority. The API
  literally answers `402` until backing is real (`apps/api/surgeon.js`,
  `/surgeon/status`, `/surgeon/authorize`).
- **Human-backed agent (AgentBook on World Chain) → may PROPOSE revokes.** We verify
  the agent's standing with `createAgentBookVerifier()` before it can touch approvals,
  and the front-end **re-asserts the check at OPERATE-click time** so nothing that
  flips a button can hand it authority it didn't earn.
- **The agent never holds keys.** It builds `approve(spender, 0)` transactions
  (`apps/api/onchain.js`); **the human signs each one** in their own wallet. The agent
  proposes; the person decides.

The blocked state is the product: watch an anonymous agent get told *"diagnose —
never cut,"* then watch a human backing unlock it.

**Why it scores:** it's the reference answer to the question every agent platform hits
next year — safe autonomous financial authority — with running code, not a slide.

---

## 🏆 Selfie Check ($1,750)

**Backing has to stay alive — a stolen session can't keep the knives.**

A one-time verification is a credential to steal. So authority **decays**: the Surgeon
runs a real World ID **Selfie Check** (`worldVerify('selfie')`, live IDKit in-app) that
must be renewed **daily** to stay ON DUTY. Let it lapse and the agent goes dormant —
visibly, the closed wounds reopen on screen. Liveness sustains authority.

**Why it scores:** meaningful use — the liveness check isn't a gate you pass once, it's
the thing that keeps a powerful agent accountable to a present human, every day.
Testing docs (dev-feedback log + 20-user venue-walk form) in `docs/world-testing/`.

---

## 🏆 Identity Check ($1,750)

**After a theft, your options depend on where you live — proven without collecting who
you are.**

We're a privacy product (we don't even cache plaintext addresses), so gating recourse
on identity would betray our own thesis. The Identity Check asks exactly **two
booleans** — jurisdiction ✓ and 18+ ✓ (`worldVerify('identity')`) — and **stores
nothing**; the recourse routes then derive from the wallet's own scan (matched
incident, live wound count), not from anything about the person.

**Why it scores:** textbook data-minimization — prove the property, not the person —
which is exactly the shape regulators and privacy-conscious users want. Two booleans,
nothing stored.

---

### Submission requirements (all three)
- Public repo + README ✓ · live demo ✓ · demo video ⏳ · team contacts ⏳ (TG + X).
- World SDKs: `@worldcoin/agentkit` (AgentBook verifier, server-side authority gate),
  World ID IDKit for Selfie + Identity Checks (`worldVerify`), World Chain for the
  agent's on-chain standing; revoke txs signed by the user via `window.ethereum`.
- The ONE pending human step: an Orb-verified approval of the agent wallet in World
  App (flips `humanBacked` true) — everything else is built and live.

### Difficulty we hit & solved (say this)
The docs invite a wrong assumption: that agent human-backing needs a World App ID and
the classic IDKit orb-verify widget. It doesn't — AgentKit backing is its own flow
(register the agent wallet in AgentBook via the CLI, a human approves in World App,
the backend verifies with `createAgentBookVerifier()`), while Selfie/Identity Checks
DO use the Developer Portal. Two adjacent products, two paths, one confusable page —
our repo is the worked example for all three at once.
