# Demo script — ETHGlobal Lisbon 2026

Judges said it plainly: **less slides, more demo.** There is no deck. This is the run.

**Live:** https://tracely.live/cooked/ · **Rule:** only ever type a pinned demo wallet
(vitalik.eth · jaredfromsubway.eth · sifuvision.eth · Justin Sun `0x3DdfA8eC…5296`) —
those answer from cache in under a second. A cold address takes minutes and will eat
the whole slot.

Before you walk up: open the live URL, hard-refresh once, dismiss the intro tour, leave
the input empty. Have `/docs/SUBMISSION.md` open in a second tab for the AI question.

## The 4-minute finalist run

Total 4:00 demo + 3:00 Q&A. Times are cumulative — if you are past the marker, cut
ahead, don't compress your speech.

**0:00 — the hook (say it before you touch anything)**

> "Everyone got cooked this year. The only question is how much. This is Spotify
> Wrapped for your worst DeFi decisions — except it can fix them."

**0:15 — paste and run.** Type `vitalik.eth`. Say while it lands:

> "No connect, no signature, no account. Any address, any ENS name."

Land on the verdict: **100 / 100, CHARCOAL.** Let the number sit for a beat.

**0:40 — the autopsy is real, not vibes.** Scroll the four surfaces. Point at the
approvals count out loud — **2,166 live approvals** across 21 chains:

> "These aren't from an indexer. We pull raw Approval logs across 21 EVM mainnets and
> then re-check every single pair with a live allowance call. If that re-check fails,
> the wound stays open and flagged — we fail closed, never silently 'revoked'."

**1:20 — the seal is the trust surface.** Tap the wax seal. Receipts open:

> "The score isn't our formula — it's an LLM verdict sealed inside a 0G Compute TEE,
> signature-verified per response. The rubric it must obey is hash-committed on-chain
> in our registry on Galileo. If the on-chain hash and our local rubric ever diverge,
> the judge refuses to seal. Nobody — including us — can quietly change the rules."

**2:00 — the part Wrapped can't do.** Go to the Surgeon screen.

> "This is an agent with a 0G Agentic ID. Two hard rules. One: it never holds your
> keys — it prepares the revocation, you sign it. Two: no face, no scalpel."

Show the BLOCKED state first — anonymous agent, diagnose only.

> "An anonymous agent asking to touch your money gets a red BLOCKED. Authority comes
> from World: AgentKit's AgentBook verifies a human is backing this agent, on World
> Chain. And it expires — let it lapse and your Surgeon goes off duty, wounds reopen.
> Most projects make the human's identity the credential. We made the agent's
> *authority* the thing that's human-backed, and made it decay."

**2:50 — pull the knife out.** Run the revoke flow through to the discharge screen.

**3:20 — the comeback card.** Land on DISCHARGE PAPERS, the was/now score.

> "Misery is the loop in — people share the shame card. Recovery is the loop back:
> was 68, now 31, live exposure defused. That's the card people actually share."

**3:40 — close.**

> "Three deliverables, all open source: the app; SEAL, which turns 0G into eight MCP
> tools so any agent gets sealed inference in one config line; and cooked-skill, our
> autopsy packaged as an MCP server so any agent can borrow our coroner."

## Booth variants (60–90 seconds, in person)

Partner judging happens at the booths. Same product, different load-bearing claim.

**0G booth.** Open on the seal receipts, not the score.
Sealed judge in a TEE (qwen2.5-omni-7b, per-response signature verification) →
CookedRegistry on Galileo `0x5d60…CFcE` with `rubricHash == keccak256(rubric.md)` →
encrypted history in 0G Storage → Surgeon holds Agentic ID tokenId 2 (`0x584E…38F2`).
Then the infra pitch: **zero 0G SDK imports in the app** — everything goes through SEAL,
our standalone MCP server; the stub backend emits self-consistent fake attestations that
`seal_verify` genuinely rejects when tampered, so we built the whole product offline and
flipped to live 0G without touching product code. Offer them the architecture diagram in
the README.

**World booth.** Open on the Surgeon in its BLOCKED state.
The inversion: usual pitch is "human-backed agent gets perks"; ours is "the agent's
authority to touch your money is human-backed and expires daily." AgentBook verifier on
World Chain gates OPERATE. It never holds keys. Then show the testing docs in
`docs/world-testing/` — the developer-friction log kept live during integration and the
anonymous venue user test — because both beta tracks require exactly that.

**The Graph booth.** Open on the autopsy surfaces, then the code.
Graph data is load-bearing: the surfaces *are* the judge's evidence — no Graph, no
verdict. One Messari-standardized query shape covers Aave v3, Compound v3 and Spark —
**show the registry line** and say "adding a conforming market is one line." Uniswap v3
composes on the same registry, and the guardian TVL alarm feed on top of that. Finish
with cooked-skill: same engine as our product, packaged as an MCP server + SKILL.md, so
it's reusable tooling and not a single-user app.

## Q&A prep

**"How did you use AI?"** — asked of everyone, expect it. Answer in two halves.
AI *in* the product: the score is a TEE-sealed LLM verdict with a proof chain, not a
formula. AI *building* the product: Claude Code as pair programmers across several
machines, coordinated by ccbridge — a task queue and message bus we wrote for this
hackathon; `ccb.js` and its protocol in `CLAUDE.md` are committed. Humans set direction
and the hard rules (key custody, privacy boundary, TEE verification) and reviewed
everything. Do not say AI generated the idea — that's their stated anti-pattern.

**"Is any of this mocked?"** — No. Every number is live chain data; a verdict that
couldn't see a chain carries `partial` all the way to the UI instead of pretending.
The one staged element is labelled in the UI as a demo preview.

**"Your address never touches your servers, right?"** — Careful, don't overclaim.
Correct answer: no connect, no signature, no account; the Graph key stays server-side so
queries run there; cache entries are keyed by `sha256(address)` and expire on a TTL, so
there's no queryable ledger of who looked up what. The cached report body does contain
the address it describes, and we say so in the README.

**"Why 21 chains?"** — Every keyless RPC gateway that passed a wide-range `getLogs`
probe. Where a provider refuses a full-range query we chunk; where the re-check fails
we fail closed.

**"What's not finished?"** — Say it straight: World App transaction signing through
MiniKit is staged in the UI pending our App ID; everything behind it — the AgentBook
verification, the prepared revoke transactions — is live.

## The one thing that can kill the demo

The live deployment. Freeze deploys before Sunday morning, then re-run the four demo
wallets on the actual demo laptop and network before judging. If the venue wifi dies,
the PWA shell still loads from the service worker — but scans need the network, so have
a phone hotspot ready.
