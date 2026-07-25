# Pre-pitch checklist — ETHGlobal Lisbon 2026

Compiled from ethglobal.com/events/lisbon2026/prizes (fetched 25 Jul 2026).
**Submissions close Sunday 26 Jul, 09:00.** Judging Sunday; ENS judges at their
booth Sunday morning. Live demo: https://freenodalvpn.xyz/cooked/

## Tracks we're aiming at

| Sponsor | Track | Pot (1st) | Fit |
|---|---|---|---|
| 0G | Best AI Product on 0G | $3,000 | **core** — sealed TEE judge + Storage + Agentic ID + registry |
| 0G | Best Infrastructure & Tooling | $1,500×3 | SEAL as standalone dev tooling — decide if we pitch both |
| World | AgentKit New Use Cases | $4,000 | **core** — human-backed Surgeon via AgentBook |
| World | Selfie Check Beta | $1,000 | the ON-DUTY gate; needs real integration + testing docs |
| The Graph | Best AI Tooling for The Graph | $2,500 | cooked-skill (MCP server + SKILL) is literally the brief |
| The Graph | Best AI Use Case | $2,000 | Graph is load-bearing, judge is the AI reasoning layer |
| The Graph | Composable/Standardized | $2,000 | Messari standardized schemas + Uniswap v3 composition |
| ENS | Most Creative Use of ENS | $1,500 | stretch — .eth scan input; booth pitch conflicts with 9AM deadline |

Not us: 1inch (Aqua contracts), Hedera, Sui, Uniswap Foundation (requires their
API + key — we read Uniswap via The Graph, doesn't qualify). Continuity tracks
are for prior-event projects — we're a fresh build, standard tracks only.

## 0G — Best AI Product ($3k/$2k/$1k)

Required, per prize text:

- [x] End-user product on 0G Compute — sealed judge, per-response signature verify
- [x] 0G Storage — encrypted scan history (AES-256-GCM client-side)
- [x] Public repo + setup instructions
- [ ] **Proof of 0G Compute usage for inference** — show a real Galileo attestation
      in the demo, not stub mode (t4, local2 verifying endpoint)
- [ ] **Agentic ID minted + 0G explorer link** — explicitly required if we claim
      Agentic ID usage (t4)
- [ ] **CookedRegistry deployed on Galileo + rubric hash** — address in submission (t7)
- [ ] Demo video **≤3 min** — t17 plans 2:50, fits; must show the 0G features
- [x] Live demo link
- [ ] Team Telegram & X handles in the submission

Infra & Tooling sub-track wants: ≥1 working example agent using the framework
(seal has `examples/goldfish.ts` + `examples/desk-check.ts` ✓) and an architecture
diagram (recommended) — one diagram of app → SEAL(MCP) → 0G would serve both tracks.

## World — AgentKit New Use Cases ($4k/$2.5k/$1.5k)

- [x] AgentKit used meaningfully — AgentBook verifier on World Chain, agent
      self-check, /surgeon/status|authorize|probe (commit 9493c6a)
- [x] Human-backed agent verification — the whole "no face, no scalpel" interlock
- [ ] **End-to-end working flow** — biggest gap: revoke tx signing in World App is
      staged in UI, MiniKit wiring not done (t15, blocked by APP_ID — t6, needs a
      human with a World dev portal account)
- [ ] "Genuinely new workflow" — pitch line ready: an agent whose *authority*
      (not identity) is human-backed and expires daily

### Selfie Check Beta ($1k/$750) — only if t6/t15 land

- [ ] Real Selfie Check integration (currently designed, not wired)
- [ ] **Testing documentation** — REQUIRED: developer-friction log (SDK/API, docs)
      + user feedback (UX, camera flow). t6 already plans a dev-feedback log —
      keep notes from minute one of integration, it doubles as the deliverable.

## The Graph — three standard tracks (apply to all three)

Common to all: public repo ✓, **2–4 min demo video** (t17's 2:50 fits all sponsors'
windows), live data via Graph gateway ✓ (no mocks anywhere ✓).

- **AI Tooling** (30% usefulness / 25% reusability / 20% Graph use / 15% execution /
  10% innovation): cooked-skill is an MCP server + SKILL.md with README ✓ — pitch
  it as "any agent can borrow our coroner", show a second client consuming it.
- **AI Use Case** (35% Graph effectiveness / 25% usefulness / 20% execution):
  autopsy surfaces feed the TEE judge — Graph data is load-bearing by construction.
- **Composable/Standardized**: one query shape across Aave v3 / Compound v3 / Spark
  via Messari standardized schemas + Uniswap v3 on the same registry — say
  "adding a lending market is one registry line" and show the line.

## ENS (stretch, $1.5k)

.eth input with 3-RPC fallback works and demo wallets are ENS names — but the bar
is "clearly improves the product, not cosmetic", and judging is **in person at the
ENS booth Sunday morning**, right against the deadline. Decision: only pitch if
someone is free at the booth window; the argument is onboarding ("paste a name,
not an address" is why strangers actually try it).

## Organizer (ETHGlobal) basics

- [x] Public GitHub repo, MIT license, real git history (continuous commits, no
      single final-day dump)
- [x] No mocked data — every number is live chain data
- [ ] **Explicitly tick every prize track in the submission form** — most sponsor
      prizes require applying, silence = ineligible
- [ ] Demo video uploaded (2:50 — inside every sponsor's limit: 0G ≤3, Graph 2–4,
      others ≤5)
- [ ] Live demo working at judging time — freeze deploys before Sunday morning,
      keep the demo-wallet cache warm (t35)
- [ ] Checklist pass 3h before deadline (t17)

## Open gaps, by owner

| Gap | Bridge task | Blocks |
|---|---|---|
| World APP_ID (dev portal, human) | t6 | t15, both World prizes |
| MiniKit signing end-to-end | t15 | World AgentKit "working flow" |
| Agentic ID mint + explorer link | t4 (local2) | 0G "must include" |
| CookedRegistry deploy on Galileo | t7 | 0G pitch: "rubric hash on-chain" claim |
| Live TEE attestation in demo (not stub) | t4 | 0G "proof of Compute usage" |
| 2:50 video + clips | t17 | every track |
| Selfie Check + testing docs | t6/t15 | World Selfie Check Beta |
| Team Telegram/X contacts | — | 0G submission field |
