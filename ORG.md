# ORG — team checklist

Deadline: **Sunday, July 26, 09:00** (submissions close).
Finalist judging: live, 4 min demo + 3 min Q&A. Partner judging: in person at booths.

## Dashboard & admin

- [ ] Team complete on ETHGlobal dashboard (max 5 members)
- [ ] Track selected: **From Scratch** (one track per team, applies to everyone)
- [ ] Partners selected: **0G + The Graph + World** (max 3; multi-track partner = one slot)
- [ ] Partner logos selected on the dashboard (required for partner judging)
- [x] Repo start confirmed OK with organizers (first commit = LICENSE only)
- [x] Commit policy DECIDED: commit under the team's GitHub identity, **no `Co-Authored-By: Claude` / no AI-author footer** (per ccbridge protocol; ETHGlobal permits AI use, so this is a stylistic team choice, not concealment)
- [x] ccbridge connected: domain freenodalvpn.xyz confirmed as ours by Nikita; endpoint is `https://freenodalvpn.xyz/bridge` (path prefix — the bare domain is our unrelated VPN site). Agent `nikita` registered and on the queue. Token stays out of repo/commits; **rotate after the event** (it was pasted into a chat)

## Desk checks (booths, today)

- [ ] **0G**: Compute endpoints for sealed inference; confirm 0G Storage memory requirement scope; Agentic ID mint
- [ ] **The Graph**: which standardized subgraphs are live (lending + DEX); MCP/SKILL expectations for AI Tooling track
- [ ] **World**: one project across AgentKit + Selfie Check + Identity Check — allowed? testing-docs format expectations
- [ ] **ETHGlobal**: second submission per team allowed at all? (only matters if we ever split SEAL out)

## Build milestones (never-cut list at the bottom)

- [ ] Sealed inference proven against 0G Compute from a bare script (highest-risk dependency — FIRST)
- [ ] Monorepo scaffold: `apps/web` · `packages/seal` · `packages/cooked-skill`
- [ ] Autopsy engine as a library from hour one (makes cooked-skill extraction ~3h of packaging)
- [ ] Scan across ≥2 standardized subgraphs, queries client-side
- [ ] Verdict UI: preheat ticker → dial sweep → stamp → roast → knives
- [ ] Seal attestation UI (TEE proof, registry tx, rubric hash)
- [ ] Minimal `seal.memory.put` history write to 0G Storage (0G Product requirement)
- [ ] Surgeon: diagnose → prepare revocations → BLOCKED for anonymous → Selfie-backed revoke → sign in World App
- [ ] Re-scan + recovery card + percentile histogram
- [ ] Empty state ("Raw — nothing to cook yet") — judges paste fresh wallets
- [ ] `packages/seal`: own README, architecture diagram, `examples/goldfish.ts`, npm publish
- [ ] `packages/cooked-skill`: packaged as MCP tool, usable from a generic agent
- [ ] Deployed and LIVE at a public URL (finalist requirement)

**Never cut:** standardized-schema scan · sealed judge + attestation + registry · Selfie-gated revoke · minimal 0G Storage history write · cooked-skill packaging.
**Cut order if desperate:** sweep tier → grief ticker → recovery graph UI.

## World testing docs (mandatory deliverable for both World beta tracks)

- [ ] Developer feedback log template (log SDK friction *while* integrating)
- [ ] Venue-walk user test form template (~20 people)
- [ ] Venue walk actually done (collect between builds, at the venue)
- [ ] Data-minimization paragraph written (two booleans: jurisdiction, 18+; nothing persisted)

## Video (2–4 min, ≥720p, human voice, no speed-ups)

- [ ] Script locked — `VIDEO-SCRIPT.md` (target 2:50)
- [ ] Narrator rehearsed (deadpan; one beat after every stamp)
- [ ] Screen captures recorded the night each piece first works
- [ ] Real footage: Selfie Check + World App signing flow
- [ ] Data-replay disclosure line kept in the cut
- [ ] Two subgraphs visibly named in the preheat ticker
- [ ] Music picked & rights-checked (candidate: Fox Stevenson — "Sunk Cost Fallacy"); music only under cold open / stamps / close, never over narration
- [ ] Final edit ≤ 3:00, exported ≥720p, voice on real mic

## Submission package

- [ ] Project page: detailed description + screenshots
- [ ] README: what it is, how to run, architecture diagram
- [ ] "How we used AI" section (they will ask; plan files `IDEA.md`, `VIDEO-SCRIPT.md`, `ORG.md` already in repo)
- [ ] Git hygiene: many small commits, meaningful messages
- [ ] Demo video uploaded and linked
- [ ] Live deployment URL in the submission
- [ ] Submitted before **Sun 09:00** (target: Sat 23:00 internal freeze)

## Timeline sanity

- Sat daytime — core build complete (autopsy + verdict + surgeon happy path)
- Sat evening — packaging (seal npm, cooked-skill), venue walk done, video edit
- Sat 23:00 — internal freeze: only bugfixes and submission text after this
- Sun 08:00 — submission in, coffee, rehearse the live 4-minute demo
