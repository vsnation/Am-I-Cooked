# HOW IT WORKS — the three sponsor stories, from the inside

*Pitch prep: each section is (1) the story in one breath, (2) the mechanism in plain
words, (3) exactly where it lives in the code, (4) what to show, (5) the answers to
the questions judges actually ask.*

---

## THE GRAPH — "one query shape covers all of DeFi"

**One breath:** finding your risk means checking every lending market and DEX you ever
touched. Normally that's a custom integration per protocol. With standardized subgraphs
it's ONE query, run against many protocols — adding a protocol is one line of config.

**Mechanism.** Every protocol that follows the Messari standardized schema exposes the
same GraphQL shape (`positions`, `market`, `asset`…). So we write the lending query
once, and run it against Aave v3, Compound v3 and Spark by just swapping the subgraph
ID. Uniswap v3 uses its own dialect — that's the second "schema" in our registry.

**In the code:**
- `apps/api/autopsy.js:20` — `REGISTRY`: four subgraphs, each tagged with the
  `schema` dialect it conforms to. *This list is the whole integration.* Adding
  another Messari-conforming protocol = one new line.
- `apps/api/autopsy.js:31` — `gql()`: the single gateway caller (the API key lives
  server-side only; the browser never sees it).
- `apps/api/autopsy.js:71` — `lendingSurface()`: ONE standardized query, mapped over
  every `messari-lending` source. This is the demo line for "composable".
- `apps/api/alarm.js:95` — `pollTopPools()`: a SECOND Graph product (live pool-TVL
  feed) composed in for the guardian alarm; `AlarmEngine.observe()` (`alarm.js:40`)
  turns TVL samples into drain alarms. Source-agnostic: a Substreams sink can replace
  polling without touching the engine.
- `packages/cooked-skill/` — the whole autopsy packaged as an MCP tool ("address in →
  risk profile out") any agent can drop in. `SKILL.md` documents it.

**Show:** scan a wallet, then open `autopsy.js:20` — "these four lines ARE the
integration. Same query, three lending protocols."

**Judge Q&A:**
- *"Is the data live?"* — yes, gateway queries at request time, zero mocks; the first
  vitalik scan you watched hit Aave/Compound/Spark/Uniswap live.
- *"What did the standard schema buy you?"* — we wrote one lending query in an hour
  instead of three integrations in three days, and every future Messari-conforming
  protocol is a one-line add.

---

## 0G — "the verdict is sealed, and you can check the seal"

**One breath:** every wallet checker logs the address you paste. Ours scores you inside
a TEE, validates the verdict against a rubric whose hash was committed on-chain at
deploy, and anchors the result in a registry — tap the wax seal in the app and the
real transaction opens on the explorer.

**Mechanism, step by step** (all orchestrated by `apps/api/sealjudge.js`):
1. **Rubric is law.** `contracts/rubric.md` is the scoring constitution. Its keccak256
   (`0x81bb26…607e`) was baked into `CookedRegistry`'s constructor at deploy
   (`contracts/CookedRegistry.sol:24`) — immutable. `sealjudge.js` re-hashes the local
   rubric and reads the on-chain one (`assertRegistryRubric`) — **if they differ,
   sealing refuses to run.** The judge's rules cannot drift after launch.
2. **TEE inference.** The scan report is slimmed (`slimForJudge` — a 1.4MB surface
   digest that keeps everything the rubric formulas consume) and sent through the
   SEAL backend into a **0G Compute TEE** (`packages/seal/src/core.ts:125`,
   `LiveBackend.infer`): the broker discovers a verifiable provider on-chain, sends
   the prompt, and **verifies the provider's signature on this exact response**
   (`processResponse`) — that's `teeVerified: true`, per answer, not per marketing.
3. **The rubric gate.** The model's output goes through `parseVerdict`
   (`apps/api/judge.js:74`): wrong weights, wrong band, score that doesn't equal the
   weighted components — rejected. An LLM cannot freestyle a verdict past this gate.
4. **On-chain attest.** The verdict is canonicalized and hashed (`judge.js:107`,
   `scoreHash`) and `CookedRegistry.attest(scoreHash, attestationHash)` is called on
   Galileo (submitter-gated, `CookedRegistry.sol:31`). Idempotent: an identical
   verdict recovers its original tx from the `Attested` event log.
5. **Identity + memory.** The Surgeon holds **Agentic ID #2** on
   `contracts/AgenticID.sol` (encrypted metadata URI in 0G Storage, ERC-7857-style);
   SEAL's encrypted memory uses 0G Storage with a key derived from the agent's own
   secret (`core.ts`, `memCipherKey`).
6. **The app never imports 0G SDKs** — every 0G call goes through the SEAL layer
   (that's the SEAL-track thesis: 0G as MCP tools, `packages/seal/src/index.ts`,
   8 tools including `seal_verify`, which verifies ANY agent's attestation).

**In the app:** the wax seal on the verdict screen → `loadSealStatus()`
(`apps/web/index.html:1166`) fetches `/cooked-api/seal-status` and renders the REAL
score hash, model, and tx link — there are no staged values left in that modal.

**Show:** scan `jaredfromsubway.eth`, tap **SEALED · TAP TO VERIFY**, click the tx —
explorer opens on the attest. Then say: "the rubric hash in that contract was
committed before any wallet was scored."

**Judge Q&A:**
- *"Is the TEE real or stubbed?"* — real: qwen2.5-omni-7b via the 0G Compute broker,
  per-response signature verification; the stub exists only for offline tests and is
  labeled.
- *"What stops the model from making up a score?"* — `parseVerdict` recomputes the
  rubric math; off-rubric output is rejected, twice, then the seal honestly fails.
- *"Why should I trust the rubric?"* — you don't have to trust it, you can hash it:
  the contract's `rubricHash` is immutable and matches `contracts/rubric.md`.

---

## WORLD — "an agent with knives, and a human holding the leash"

**One breath:** an AI agent that can touch your funds is exactly what you're afraid
of. Our Surgeon can only *propose* revocations, only while a verified human stands
behind it — and it never holds your keys; you sign every revoke yourself.

**Mechanism.**
1. **The authority ladder.** `apps/api/surgeon.js:49` — `surgeonAuthorize()`: the
   Surgeon's wallet is checked against **AgentBook on World Chain**
   (`createAgentBookVerifier`, `surgeon.js:15`). Unregistered/anonymous →
   `diagnose only — zero signing authority`. Human-backed → `revoke` authority.
   Not a UX flourish: the server returns 402 until the backing is real.
2. **The interlock, twice.** The web's `verifyHuman()` (`apps/web/index.html:847`)
   asks `/surgeon/status` and only then enables OPERATE — and `operate()`
   (`index.html:889`) **re-asserts** `__surgeonHuman` at click time, so nothing that
   flips a button's disabled state can hand the agent a knife it didn't earn.
3. **The human signs, always.** The revoke is a prepared `approve(spender, 0)`
   transaction (`apps/api/onchain.js:42`, `buildRevoke`) — the agent constructs it,
   the USER's own wallet signs it. The agent proposes; the human decides.
4. **Selfie Check** (beta track): daily liveness *sustains* the authority — lapse and
   the Surgeon goes dormant. **Identity Check**: the post-theft recourse panel asks
   exactly two booleans (jurisdiction, 18+), stores nothing
   (`docs/world-testing/` has the venue-walk testing docs).

**Show:** open the Surgeon screen anonymous → OPERATE is locked with the interlock
copy ("Anonymous agents may diagnose — never cut"). That *blocked* state is the
feature: a safety interlock on autonomous financial authority.

**Judge Q&A:**
- *"Could the agent drain me instead?"* — it can't sign anything; it holds no keys.
  It builds `approve(spender, 0)` txs and you sign them in your own wallet.
- *"What does World add that a password doesn't?"* — a *person*, provably: AgentBook
  ties the agent's authority to an Orb-verified human, and daily liveness keeps that
  binding fresh. A leaked API key can't keep the knives.
- *"Is it live?"* — the AgentBook check is live on World Chain (the agent is
  registered; watch the gate correctly BLOCK until the human approval lands — the
  honest failure is the demo).

---

## The one paragraph that ties it together

The Graph **finds** the damage (one standardized query across all of DeFi, live).
0G makes the verdict **trustworthy** (TEE-judged, rubric-gated, sealed on-chain —
checkable mid-pitch). World makes the fix **safe** (a human-backed agent that can
only propose, never sign). Diagnosis → sealed verdict → supervised surgery. Every
step on screen is real and independently verifiable while the judge watches.
