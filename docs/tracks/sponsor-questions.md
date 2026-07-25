# Sponsor questions — The Graph · 0G · World

Per-sponsor form answers: *how are you using this protocol · line of code · ease 1–10 ·
feedback*. Permalinks are pinned to commit `891984a` so line numbers stay valid.

Base: `https://github.com/vsnation/Am-I-Cooked/blob/891984a/`

---

## The Graph

**How are you using this Protocol / API?**

> The Graph is the evidence layer of the whole product — no Graph, no verdict. Every
> autopsy surface (lending positions, DEX history, the guardian's TVL feed) is queried
> through the Graph gateway, and the TEE-sealed LLM verdict is computed from those
> surfaces and from nothing else. We query **Messari standardized schemas**, so one
> query shape covers Aave v3, Compound v3 and Spark — adding a conforming lending
> market is literally one line in the source registry. Uniswap v3 rides the same
> registry as a second dialect, and the guardian composes on top of it: three product
> surfaces out of one standardized schema family. We also shipped the engine back out
> as `cooked-skill`, an MCP server + SKILL.md so any agent can mount the same autopsy
> in one config block — the same code our own product runs.

**Line of code**

- Gateway query helper — [`apps/api/autopsy.js:35`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/apps/api/autopsy.js#L35)
- One standardized query, three lending markets — [`apps/api/autopsy.js:18-47`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/apps/api/autopsy.js#L18-L47) (registry + `MESSARI_ACCOUNT`)
- Guardian TVL poll over the Uniswap subgraph — [`apps/api/alarm.js:95`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/apps/api/alarm.js#L95)
- Reusable MCP server (5 tools, key never a tool argument) — [`packages/cooked-skill/src/index.js:13`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/packages/cooked-skill/src/index.js#L13)

**Ease of use: 8/10**

**Feedback**

> The standardized schemas are the reason this project exists in its current shape —
> "one query, N protocols" turned a week of per-protocol adapters into a registry with
> one line per market, and it is the single most undersold thing on the docs site. Two
> concrete asks. (1) There is no machine-readable directory of *which* subgraphs
> conform to *which* standardized schema and at what version — we discovered
> conformance by trial and error, sending our query and reading the errors. A JSON
> index (schema → subgraph IDs → schema version) would have saved hours and would make
> "adding a market is one line" true for users, not just for us. (2) Field-level
> divergence inside a "standardized" subgraph is silent: two Messari-lending subgraphs
> disagreeing on an optional field surfaces as `null`, indistinguishable from "the user
> has no position". We had to fail closed and mark surfaces `partial` to stay honest.
> A `schemaVersion` / conformance-level field in `_meta` would let clients tell
> "missing data" from "no data" without guessing. Small praise: gateway keys work
> immediately and rate limits were never the problem during a hackathon weekend.

---

## 0G

**How are you using this Protocol / API?**

> The cooked score is not a backend formula — it is an LLM verdict computed inside a
> **0G Compute TEE**, with the response attestation signature verified per call, judged
> against a rubric whose `keccak256` is committed on-chain in our `CookedRegistry` on
> Galileo; the judge refuses to seal anything if the on-chain `rubricHash` diverges from
> local `rubric.md`, and the parser recomputes the rubric math and rejects off-rubric
> output. Verdict hashes are anchored first-write-wins, scan history lives AES-256-GCM
> encrypted in **0G Storage**, and the Surgeon agent carries an **Agentic ID**
> (tokenId 2). We also built the integration as a product in its own right: **SEAL**, a
> standalone MCP server exposing 0G as 8 tools — the app itself contains *zero* 0G SDK
> imports, so any MCP client gets 0G in one config line.

**Deployed on Galileo (16602):** CookedRegistry `0x5d6093C9C6f9118dBD6ae87770dB1E964D06CFcE` ·
AgenticID `0x584E00F2a526AB3a3966237c376e97BC6f8338F2`

**Line of code**

- TEE inference via the compute broker + attestation — [`packages/seal/src/core.ts:112`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/packages/seal/src/core.ts#L112) … [`:149`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/packages/seal/src/core.ts#L149)
- Encrypted 0G Storage upload / download — [`packages/seal/src/core.ts:160`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/packages/seal/src/core.ts#L160)
- Agentic ID mint / load — [`packages/seal/src/core.ts:200`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/packages/seal/src/core.ts#L200)
- Rubric-hash gate + on-chain `attest()` — [`apps/api/sealjudge.js:90`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/apps/api/sealjudge.js#L90) … [`:114`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/apps/api/sealjudge.js#L114)

**Ease of use: 6/10**

**Feedback**

> Compute is genuinely impressive — sealed inference with a per-response signature you
> can verify is the hardest part of "verifiable AI", and it works. The friction is
> everything around it. (1) **Provider discovery is the weak link.** Services come and
> go, model names are not stable across providers, and there is no documented way to ask
> "which providers are live right now, serving which model, at what price" without
> listing and probing. We ended up pinning by service type with a fallback to
> `services[0]`, which is not something we'd ship to production. (2) **Attestation
> verification needs a first-class helper.** We wrote our own attestation encoding
> (`og1-…`) around the SDK because there was no obvious "verify this response came from
> a TEE" call an auditor could re-run independently — please expose verification as a
> supported, documented API, ideally re-runnable from a hash alone. (3) **A stub /
> offline mode should ship in the SDK.** We built one ourselves (self-consistent fake
> attestations that our verifier genuinely validates and rejects when tampered) and it
> was the highest-leverage decision of the hackathon: the entire product was built and
> tested against the stub, then flipped to live 0G without changing a line of agent
> code. Every team will need this; today every team writes it twice. (4) Docs papercut:
> testnet funding, indexer URLs and RPC endpoints are spread across three pages and
> a Discord message — one "Galileo: everything you need" page would fix it.

---

## World

**How are you using this Protocol / API?**

> We inverted the usual agent pitch: instead of a human-backed agent getting perks, the
> agent's **authority to touch your money is human-backed and expiring**. The Surgeon —
> which prepares `approve(spender, 0)` revocations for wallets bleeding through old
> approvals — is checked against **AgentBook on World Chain** via `@worldcoin/agentkit`
> on *every* request, server-side: no verified human backing → the API answers 402 and
> the agent may diagnose but never prepare a transaction (big red BLOCKED in the UI).
> **Selfie Check** is the on-duty switch that keeps that backing fresh daily — a risk
> gate, not a login; let it lapse and "your Surgeon went off duty — 2 wounds reopened".
> **Identity Check** gates recourse on exactly two booleans (jurisdiction eligibility,
> 18+) — we never see biometrics or any attribute beyond those booleans, and persist
> nothing: reload means re-verify. The agent never holds keys; the human signs every
> transaction in their own wallet.

**Line of code**

- AgentBook verifier wired into the agent hooks — [`apps/api/surgeon.js:7`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/apps/api/surgeon.js#L7) … [`:15`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/apps/api/surgeon.js#L15)
- The gate: not human-backed → OPERATE refused — [`apps/api/surgeon.js:60`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/apps/api/surgeon.js#L60)
- Selfie Check + Identity Check proof verification (two Portal actions, one verifier) — [`apps/api/world.js:46`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/apps/api/world.js#L46)
- Frontend re-asserts backing at OPERATE-click time — [`apps/web/index.html:928`](https://github.com/vsnation/Am-I-Cooked/blob/891984a/apps/web/index.html#L928)

**Ease of use: 7/10**

**Feedback**

> The cloud verify API is the good part: one POST, an honest pass/fail plus a nullifier,
> nothing about the person leaks to us — that is exactly the shape a privacy-preserving
> gate should have, and it let us make a real claim ("the app sees two booleans") instead
> of a marketing one. AgentKit friction, in the order it bit us. (1) **The
> registered-vs-unregistered failure mode is invisible until runtime.** An agent wallet
> that is not in AgentBook fails at request time with a bare 402 — there is no
> "am I registered?" precheck in the SDK and no local way to assert the state your
> integration expects, so we wrote our own status endpoint just to make the failure
> legible to a demo audience. Ship `verifier.status(address)`. (2) **Registration is a
> two-surface dance** (CLI register → approve in World App) with no documented way to
> confirm it landed from the code side — during a hackathon that turns a 2-minute step
> into a 20-minute "is it me or is it them". (3) Selfie Check docs describe the
> happy path well but say nothing about *expiry semantics* — how long a verification is
> considered fresh, and whether re-verification reuses the nullifier — which is the whole
> design question for anyone using it as an ongoing authority rather than a one-time
> login. That's the use case we built; a paragraph on it would help the next team.
> (4) Papercut: `APP_ID` must include the `app_` prefix exactly as shown in the portal;
> without it MiniKit init is a silent no-op with no console error.
