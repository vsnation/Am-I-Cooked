# Pre-pitch checklist — ETHGlobal Lisbon 2026

Sources: ethglobal.com/events/lisbon2026/prizes (verbatim re-check 25 Jul) and the
17 opening-ceremony slide photos (24 Jul).

- **Submissions close: Sunday 26 Jul, 09:00**
- **Live demo:** https://tracely.live/cooked/
- **Our three partners:** 0G, World, The Graph

## Organizer rules (from the opening slides)

These gate everything below.

- Max 5 members per team, 36.5 hours to hack, submissions due Sunday 09:00.
- **Partner selection: at most 3 partners**, picked as logos on the dashboard.
  Selecting a partner qualifies the project for **all** of that partner's prizes —
  there are no per-prize applications. Forgetting the dashboard step means the
  project is not judged by that partner at all.
- **Partner judging happens in person at the partner booths** on Sunday, before
  or after the Finalist slot if we get one.
- **Finalist Track** — up to 10 teams (7 From Scratch, 3 Continuity); partner
  prizes have no influence on selection. Requirements: auditable repository;
  open source, deployed and live; demo video in the submission; live judging of
  4 minutes demo plus 3 minutes Q&A. Their warning: "don't prepare this last
  minute". Finalist pack: 1,000 USDC per member, ETHGlobal Plus for 12 months,
  \$500 flight credit, ETHConf 2027 Pro Pass, \$15,000+ in developer credits.
- **Track selection: exactly one track per team** (From Scratch vs Continuity),
  picked on the dashboard. We are From Scratch — the repo was born at the event.
- **AI usage** is allowed (Claude, Codex, Cursor), but judges will ask how AI was
  used and expect every team member to fully understand the project. They
  recommend committing plan files to the repo — our CLAUDE.md, ccb.js and
  the AI-usage answer in docs/SUBMISSION.md are exactly that. Their explicit
  anti-pattern: pitching AI as the idea's author.
- **Key to a good submission**, in their words: record a video; less slides,
  more demo; use git properly (many commits, smaller diffs); add detailed
  descriptions and screenshots to the project page.

## Partner tracks we compete in

| Sponsor | Track | 1st prize | Fit |
|---|---|---|---|
| 0G | Best AI Product on 0G | \$3,000 | Core: sealed TEE judge, Storage, Agentic ID, registry |
| 0G | Best Infrastructure & Tooling | \$1,500 | SEAL as standalone dev tooling; qualifies automatically |
| World | AgentKit New Use Cases | \$4,000 | Core: human-backed Surgeon via AgentBook |
| World | Selfie Check Beta | \$1,000 | The ON-DUTY gate; needs integration and testing docs |
| World | Identity Check Beta | \$1,000 | Two-boolean recourse (t15); same docs plus data-minimization note |
| The Graph | Best AI Tooling for The Graph | \$2,500 | cooked-skill (MCP server + SKILL) is literally the brief |
| The Graph | Best AI Use Case | \$2,000 | Graph is load-bearing; the judge is the AI reasoning layer |
| The Graph | Composable / Standardized | \$2,000 | Messari standardized schemas plus Uniswap v3 composition |

**ENS is used, not selected.** The .eth input (3-RPC fallback resolver, ENS demo
wallets) stays a product feature and a pitch line, but with the 3-partner cap it
doesn't make the cut — no ENS booth, no ENS form.

**Not us:** 1inch (Aqua contracts), Hedera, Sui, Uniswap Foundation (requires
their API with a key — we read Uniswap via The Graph, which doesn't qualify).
Continuity tracks are for prior-event projects; we take the standard ones.

## 0G

### Best AI Product (\$3,000 / \$2,000 / \$1,000)

- [x] End-user product on 0G Compute — sealed judge, per-response signature verify
- [x] 0G Storage — encrypted scan history (AES-256-GCM, client-side)
- [x] Public repo with README and setup instructions
- [x] Live demo link
- [x] Agentic ID minted, with 0G explorer link — AgenticID contract
      0x584E00F2a526AB3a3966237c376e97BC6f8338F2, Surgeon minted as tokenId 2
      (tx 0x5cef7ee5) — https://chainscan-galileo.0g.ai/address/0x584E00F2a526AB3a3966237c376e97BC6f8338F2 (t4, done)
- [x] CookedRegistry deployed on Galileo with the rubric hash —
      0x5d6093C9C6f9118dBD6ae87770dB1E964D06CFcE, on-chain rubricHash readback
      matches keccak256(contracts/rubric.md) — https://chainscan-galileo.0g.ai/address/0x5d6093C9C6f9118dBD6ae87770dB1E964D06CFcE (t7, done)
- [x] Proof of 0G Compute usage for inference in the DEMO — judge prompt goes
      through seal LiveBackend to the 0G Compute TEE (qwen2.5-omni-7b) with
      per-response signature verification, and the verdict is anchored via
      CookedRegistry.attest; sealing refuses if the on-chain rubricHash doesn't
      match the local rubric (t99, done)
- [ ] Demo video under 3 minutes — t17 pending; must show the 0G features
- [ ] Team contacts (Telegram and X) in the submission

### Best Infrastructure & Tooling (\$1,500, up to 3 teams)

- [x] At least one working example agent using the framework — seal ships
      examples/goldfish.ts and examples/desk-check.ts
- [ ] Architecture diagram (recommended) — one diagram of app → SEAL (MCP) → 0G
      serves both 0G tracks

## World

### AgentKit New Use Cases (\$4,000 / \$2,500 / \$1,500)

- [x] AgentKit used meaningfully — AgentBook verifier on World Chain, agent
      self-check, /surgeon/status|authorize|probe (commit 9493c6a)
- [x] Human-backed agent verification — the "no face, no scalpel" interlock
- [ ] End-to-end working flow — biggest gap: revoke signing in World App is
      staged in the UI, MiniKit wiring pending (t15, blocked by APP_ID from t6,
      which needs a human on the World dev portal)
- [ ] "Genuinely new workflow" pitch line ready: an agent whose *authority*
      (not identity) is human-backed and expires daily

### Selfie Check Beta + Identity Check Beta (\$1,000 / \$750 each)

Only if t6/t15 land. Both tracks hard-require, verbatim: "Includes **testing
documentation** with both **developer feedback** and **user feedback**".
Identity Check additionally: "Explains why the requested attribute is necessary
and how the app minimizes data collection".

The scaffolding already exists in docs/world-testing/: dev-feedback-log.md
(live SDK-friction log), venue-walk-form.md (anonymous ~20-person venue user
test) and a README with the data-minimization statement that covers the Identity
Check extra (two booleans, nothing persisted).

- [ ] Real Selfie Check integration (currently designed, not wired)
- [ ] Identity Check: two-boolean recourse (jurisdiction, 18+) per t15
- [ ] Fill dev-feedback-log.md **during** the t6/t15 integration — one entry
      per friction point as it happens; an empty template does not qualify
- [ ] Run the venue walk (Saturday evening) and fill the tally — this is the
      user-feedback half of the requirement

## The Graph

Common to all three tracks: public repo, a 2–4 minute demo video (t17's 2:50
fits every sponsor's window), live data via the Graph gateway, no mocks.

- **Best AI Tooling** (judging: usefulness 30%, reusability 25%, Graph use 20%,
  execution 15%, innovation 10%) — cooked-skill is an MCP server with SKILL.md
  and README. Pitch: "any agent can borrow our coroner"; show a second client
  consuming it.
- **Best AI Use Case** (Graph effectiveness 35%, usefulness 25%, execution 20%) —
  autopsy surfaces feed the TEE judge; Graph data is load-bearing by construction.
- **Composable / Standardized** — one query shape across Aave v3, Compound v3 and
  Spark via Messari standardized schemas, plus Uniswap v3 on the same registry.
  Pitch: "adding a lending market is one registry line" — and show the line.

## Final submission checklist

- [x] Public GitHub repo, MIT license, real git history (continuous commits,
      small diffs)
- [x] No mocked data — every number is live chain data
- [x] From Scratch track: repo born at the event
- [ ] Dashboard: select the 3 partner logos (0G, World, The Graph)
- [ ] Demo video uploaded — 2:50 fits every limit (0G under 3, Graph 2–4,
      Finalist track requires one)
- [ ] Project page: detailed description and screenshots
- [ ] "How we used AI" answer rehearsed — it lives in docs/SUBMISSION.md;
      everyone pitching must be able to explain any part of the code unaided
- [ ] Live demo healthy at judging time — freeze deploys before Sunday morning,
      keep the demo-wallet cache warm (t35)
- [ ] Booth plan for Sunday: who demos at the 0G, World and Graph booths
- [ ] If finalist (announced Sunday): dry-run the 4-minute demo and 3-minute Q&A
- [ ] Checklist pass 3 hours before the deadline (t17)

## Open gaps, by owner

| Gap | Bridge task | Blocks |
|---|---|---|
| World APP_ID (dev portal, human) | t6 | t15 and all three World prizes |
| MiniKit signing end-to-end | t15 | World AgentKit "working flow" |
| 2:50 video and clips | t17 | every track |
| Filled World testing docs (docs/world-testing/) — still template-only | t6 / t15 | both World beta prizes |
| Venue walk user test (~20 people, Saturday evening) — not run yet | — | user-feedback half of World testing docs |
| Team Telegram and X contacts | — | 0G submission field |

Closed since the first pass: Agentic ID minted (t4 — Surgeon tokenId 2),
CookedRegistry deployed and hash-verified (t7), standalone live TEE inference
and encrypted Storage round-trip proven (t4). Live scan API answering 200 in
1.4s for cached demo wallets (checked 25 Jul evening).
