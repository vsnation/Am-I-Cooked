# Pre-pitch checklist — ETHGlobal Lisbon 2026

Compiled from ethglobal.com/events/lisbon2026/prizes + the opening-ceremony
slides (photos, 24 Jul). **Submissions close Sunday 26 Jul, 09:00.**
Live demo: https://freenodalvpn.xyz/cooked/

## The organizer's rules (from the opening slides — these gate everything)

- **Max 5 members**, 36.5h to hack, submissions due **Sun 09:00**.
- **Partner Track: you select AT MOST 3 partners** on the dashboard — and you
  qualify for ALL prizes of the partners you selected. Our three:
  **0G + World + The Graph**. Selecting the partner logos on the dashboard is a
  required step — forgetting it = not judged.
- **Partner judging is in person at their booths** (before or after the Finalist
  slot if we get one). Plan Sunday so someone can walk the three booths.
- **Finalist Track** (up to 10 teams: 7 From Scratch + 3 Continuity; partner
  prizes don't influence selection). Requirements: auditable repo · **open
  source, deployed, and live** · **demo video is required in the submission** ·
  live Finalist judging: **4 min demo + 3 min Q&A**, live deployment required,
  "don't prepare this last minute". Finalist pack: 1,000 USDC/member, ETHGlobal
  Plus 12 mo, $500 flight credit, ETHConf 2027 Pro Pass, $15k+ dev credits.
- **Track selection: exactly ONE continuity-vs-scratch track per team**, picked
  on the dashboard. We're **From Scratch** (code began at the event, new repo ✓).
- **AI usage:** allowed (Claude/Codex/Cursor), but **judges will ask us to
  explain how we used AI** and expect us to fully understand every part of the
  project. They recommend committing plan files to the repo — our `CLAUDE.md`,
  `ccb.js` and `docs/SUBMISSION.md` AI-usage answer are exactly that; keep them
  prominent. Don't pitch AI as the idea's author (their explicit anti-pattern).
- **Key to a good submission** (their words): record a video · less slides,
  more demo · git used properly — many commits, smaller diffs ✓ · detailed
  descriptions & screenshots on the project page.

## Partner tracks we're in (the 3 selected)

| Sponsor | Track | Pot (1st) | Fit |
|---|---|---|---|
| 0G | Best AI Product on 0G | $3,000 | **core** — sealed TEE judge + Storage + Agentic ID + registry |
| 0G | Best Infrastructure & Tooling | $1,500×3 | SEAL as standalone dev tooling — we qualify for both automatically |
| World | AgentKit New Use Cases | $4,000 | **core** — human-backed Surgeon via AgentBook |
| World | Selfie Check Beta | $1,000 | the ON-DUTY gate; needs real integration + testing docs (`docs/world-testing/`) |
| World | Identity Check Beta | $1,000 | 2-boolean recourse (t15); same testing docs + data-minimization note |
| The Graph | Best AI Tooling for The Graph | $2,500 | cooked-skill (MCP server + SKILL) is literally the brief |
| The Graph | Best AI Use Case | $2,000 | Graph is load-bearing, judge is the AI reasoning layer |
| The Graph | Composable/Standardized | $2,000 | Messari standardized schemas + Uniswap v3 composition |

Selecting a partner qualifies us for all their prizes at once — no per-prize
application, so the sub-track rows above are what their booth judges score
against, not separate forms.

**ENS is used, not selected** — .eth input (3-RPC fallback resolver, ENS demo
wallets) stays a product feature and a pitch line, but with the 3-partner cap
it doesn't make the cut, so no ENS booth, no ENS form.

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

### Selfie Check Beta ($1k/$750) + Identity Check Beta ($1k/$750) — only if t6/t15 land

Both beta tracks hard-require (verbatim): "Includes **testing documentation** with
both **developer feedback** and **user feedback**". Identity Check additionally:
"Explains why the requested attribute is necessary and how the app minimizes data
collection".

The deliverable scaffolding already exists — `docs/world-testing/`:
`dev-feedback-log.md` (live SDK-friction log), `venue-walk-form.md` (~20-person
anonymous venue user test), README with the data-minimization statement (covers
the Identity Check extra requirement: two booleans, nothing persisted).

- [ ] Real Selfie Check integration (currently designed, not wired)
- [ ] Identity Check: 2-boolean recourse (jurisdiction + 18+) per t15
- [ ] **Fill dev-feedback-log.md DURING t6/t15 integration** — one entry per
      friction point at the moment it happens, not from memory; it's an empty
      template until then, and an empty template does not qualify
- [ ] **Run the venue walk (Sat evening) and fill the tally** — this is the
      "user feedback" half of the requirement

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

## Organizer (ETHGlobal) checklist

- [x] Public GitHub repo, MIT license, real git history (continuous commits,
      small diffs — their explicit "key to a good submission")
- [x] No mocked data — every number is live chain data
- [x] From Scratch track: repo born at the event
- [ ] **Dashboard: select the 3 partner logos (0G, World, The Graph)** — required
      for partner judging to happen at all
- [ ] Demo video uploaded (2:50 — inside every limit: 0G ≤3, Graph 2–4, finalist
      track requires one, period)
- [ ] Project page: detailed description + screenshots (their explicit ask)
- [ ] Prepare the "how we used AI" answer for judges — docs/SUBMISSION.md has it;
      everyone pitching must be able to explain any part of the code unaided
- [ ] Live demo working at judging time — freeze deploys before Sunday morning,
      keep the demo-wallet cache warm (t35)
- [ ] Booth plan for Sunday: who demos at 0G / World / Graph booths, in person
- [ ] If finalist (announced Sunday): 4-min live demo + 3-min Q&A — dry-run it
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
| Selfie/Identity Check + filled testing docs (`docs/world-testing/`) | t6/t15 | both World beta prizes |
| Venue walk user test (~20 ppl, Sat evening) | — | "user feedback" half of World testing docs |
| Team Telegram/X contacts | — | 0G submission field |
