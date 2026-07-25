# Submission form answers

## Short description (≤100 chars)

> Wallet autopsy: the money you forgot, the approvals draining you, a siren before the hack lands.

(96 chars — alt: "Spotify Wrapped for your worst DeFi decisions — TEE-scored on 0G, fixed by a human-backed agent.")

## Description (min 280 chars)

> Everyone got cooked this year. The only question is how much.
>
> You know the feeling of finding €20 in last year's jacket? Your wallet has
> jackets. AM I COOKED? goes through all of them: LP positions still sitting in
> pools everyone abandoned, bags parked in protocols that quietly died in 2023 —
> money you forgot exists, surfaced in one scan. That's the fun part.
>
> Here's the unfun part: the same jacket has a hole in it. Eight months ago you
> used a protocol, approved unlimited spending "just once", and moved on. Then the
> protocol got hacked. You forgot the approval; the attacker didn't — it can move
> your tokens TODAY, no signature needed, while your balance looks fine. We trace
> every live approval across 21 EVM chains, re-verify each against the chain, match
> spenders against 177 documented hacks, and hand you the exact revoke transaction
> for each wound. Paste an address or ENS — no connect, no signatures, ever.
>
> And because getting robbed is a live event, not a history lesson: the GUARDIAN.
> Most wallet checkers are coroners — they tell you how you died. Ours is a smoke
> detector. It watches DeFi liquidity in real time, and when a pool you're exposed
> to starts draining (the real ones go 90% in minutes — we replay one on demand,
> clearly labeled), a siren literally goes off in the app, pointing at the exact
> approvals to cut before the drainer's queue reaches you. Scan → verdict →
> alarm → revoke: protection, not a postmortem.
>
> The verdict itself is a cooked score 0–100, judged inside a 0G Compute TEE
> against a rubric whose hash is committed on-chain — tap the wax seal and the real
> attestation transaction opens on the explorer. The fixing is done by the Surgeon,
> an agent with an on-chain Agentic ID that may only PROPOSE revocations: a
> verified human must back it (World AgentBook), and you sign every transaction in
> your own wallet. Anonymous agent asking to touch money → big red BLOCKED.
>
> Then you post your 100% CHARCOAL card to X and ruin your friends' evening.

## Ethereum developer tools (multiselect)

- **viem** — the API layer (ENS resolution, allowance re-checks, revoke tx encoding)
- **ethers** (v6) — SEAL MCP server (0G chain calls, Agentic ID contract)
- **The Graph** — autopsy queries via the Graph gateway (Messari standardized schemas)
- **Tenderly** — their public per-chain gateways serve our wide-range `eth_getLogs` approval scans on all 21 chains
- **ENS** — any `.eth` name works as scan input (3-RPC fallback resolver)
- **solc** — compiles `CookedRegistry.sol` / `AgenticID.sol` (no Hardhat/Foundry — a deploy script is all two small contracts need)

## Blockchain networks (multiselect)

- **Ethereum mainnet** — autopsy (The Graph) + full-history approval scan
- **0G Galileo testnet** — TEE inference, encrypted Storage, CookedRegistry + Agentic ID
- **World Chain** — approval scan + AgentBook human-backing verifier for the Surgeon
- Approval scan also covers: **Base, Arbitrum, Optimism, Polygon, Avalanche, Gnosis,
  Linea, Mantle, Blast, zkSync Era, Unichain, Sonic, Berachain, Ink, Soneium,
  Fraxtal, Celo, Moonbeam, Ronin** (21 EVM chains total — every keyless gateway that
  passed a wide-range getLogs probe)

## Programming languages (multiselect)

- **JavaScript** — the product (web PWA, Node API, cooked-skill), dependency-free by design
- **TypeScript** — SEAL MCP server (Bun)
- **Solidity** — CookedRegistry, AgenticID (ERC-7857 draft surface)
- **HTML/CSS** — hand-written, no framework

## Web frameworks (multiselect)

- **None — deliberately.** The frontend is a framework-free vanilla-JS PWA
  (installable, service worker); the API is bare `node:http`. Zero frontend
  dependencies, nothing to build.

## Databases (multiselect)

- **MongoDB** — optional scan cache with TTL auto-expiry; keyed by sha256(address),
  never the address itself. The service degrades to in-memory when Mongo is down.
- **0G Storage** — the user-facing persistence: scan history, AES-256-GCM encrypted
  client-side before upload.

## Design tools (multiselect)

- **None** — the UI is hand-coded HTML/CSS (the "cooked, not hacked" register is a
  written design brief, not a Figma file).

## Other technologies (freetext multiselect)

- **MCP (Model Context Protocol)** — two servers ship in the monorepo: SEAL (0G as
  8 MCP tools) and cooked-skill (the autopsy as an agent skill)
- **0G Compute & Storage TypeScript SDKs**
- **Worldcoin AgentKit** (AgentBook verifier; MiniKit signing flow staged in the UI)
- **Bun** — SEAL runtime + test runner
- **Messari standardized subgraph schemas** — one query shape across lending markets
- **zod**, **js-sha3**, `node:test` (75+ unit tests, all mocked-RPC, no network)
- **PWA / Service Worker** — installable, offline shell

## Per-track paragraphs (for the partner sections of the submission)

### 0G — Best AI Product

> The cooked score is an LLM verdict sealed in a 0G Compute TEE (qwen2.5-omni-7b,
> per-response signature verification), not a backend formula. The scoring rubric's
> keccak256 is committed in CookedRegistry on Galileo
> (0x5d6093C9C6f9118dBD6ae87770dB1E964D06CFcE) and the judge refuses to seal a
> verdict if the on-chain hash doesn't match its local rubric. Scan history lives
> encrypted in 0G Storage; the Surgeon agent carries Agentic ID tokenId 2
> (0x584E00F2a526AB3a3966237c376e97BC6f8338F2). Tap the wax seal in the app and
> the receipts open.

### 0G — Best Infrastructure & Tooling

> SEAL is our rule made into a product: the app contains zero 0G SDK imports.
> It's a standalone MCP server (Bun + TypeScript) exposing 0G as 8 tools — sealed
> TEE inference with signature verification, encrypted Storage memory, chain
> calls, Agentic ID mint/load — so ANY MCP client gets 0G in one config line.
> Stub mode emits self-consistent fake attestations that seal_verify genuinely
> validates and rejects when tampered, so teams can build offline and flip to
> live 0G without touching agent code. Example agents ship in the repo.

### World — AgentKit New Use Cases

> The Surgeon inverts the usual agent pitch: instead of a human-backed agent
> getting perks, its AUTHORITY to touch your money is human-backed and expiring.
> AgentKit's AgentBook verifier on World Chain gates the OPERATE mode — an agent
> without verified human backing gets a red BLOCKED and can only diagnose, never
> prepare transactions. Backing lapses daily: "your Surgeon went off duty — 2
> wounds reopened." The agent never holds keys; every revocation is signed by
> the human in World App.

### World — Selfie Check Beta / Identity Check Beta

> Selfie Check is the ON-DUTY switch for a financial agent — a risk gate, not a
> login. Identity Check adds exactly two booleans (jurisdiction eligibility,
> 18+); the app never sees biometrics or attributes beyond those booleans and
> persists nothing — reload means re-verify. Testing documentation ships in
> docs/world-testing/: a developer-friction log kept live during integration and
> an anonymous ~20-person venue user test with tally.

### The Graph — Best AI Tooling

> cooked-skill packages the whole autopsy as an MCP server + SKILL.md, so any
> agent can borrow our coroner: address in, cross-protocol risk profile out —
> Messari standardized schemas through the Graph gateway, zero dependencies,
> tested offline against fixtures. It's the same engine our own product runs,
> which is the strongest reusability proof there is.

### The Graph — Best AI Use Case

> Graph data is load-bearing: the autopsy surfaces (lending positions, DEX
> history, TVL guardian feed) ARE the judge's evidence — the TEE-sealed LLM
> verdict is computed from them and from nothing else. No Graph, no verdict.
> The guardian AlarmEngine polls top-pool TVL through the gateway and matches
> ≥25%/12min outflows against your personal exposure.

### The Graph — Best Use of Composable or Standardized Data Products

> One Messari-standardized query shape covers Aave v3, Compound v3 and Spark —
> adding a conforming lending market is one registry line (we show the line in
> the demo). Uniswap v3 rides the same registry with its own dialect, and the
> guardian TVL feed composes on top: three product surfaces from one standardized
> schema family.

## AI tools usage

> Two very different answers, both true.
>
> **AI inside the product:** the cooked score is not computed by our backend — it's
> an LLM verdict (DeepSeek-R1) running inside a 0G Compute TEE. The judge prompt
> embeds the full scoring rubric whose keccak256 is committed on-chain in
> CookedRegistry at deploy, the TEE's response signature is verified per-call, and
> the verdict hash is anchored first-write-wins. So "AI decided you're 68% cooked"
> comes with a proof chain: rubric hash → sealed inference → attestation → on-chain
> anchor. Stub mode emits fake-but-self-consistent attestations so the whole
> pipeline is testable offline.
>
> **AI building the product:** the team ran Claude Code (Anthropic) as pair
> programmers throughout — multiple agents on different machines coordinating
> through ccbridge, a tiny self-hosted task queue + message bus we wrote for this
> hackathon (`ccb.js` and its protocol in `CLAUDE.md`, both in the repo — arguably
> our fourth deliverable). Agents claimed tasks, heartbeated leases, handed work
> off with evidence (test counts, commit shas, live URLs), and escalated conflicts
> to humans. Claude wrote most of the implementation and the test suites; humans
> set the product direction, the hard rules (key custody, privacy boundary, TEE
> verification), reviewed everything, and signed every commit and transaction.

## How it's made (min 280 chars)

> Monorepo, three deliberate layers, zero frameworks.
>
> **The autopsy (The Graph).** A dependency-free isomorphic JS library queries the
> Graph gateway using Messari standardized subgraph schemas — ONE query shape covers
> Aave v3, Compound v3 and Spark; adding a conforming market is one registry line
> (`apps/api/autopsy.js`). Uniswap v3 rides the same registry with its own dialect.
> Live approvals come from raw ERC-20 Approval logs over eth_getLogs on 21 chains
> (every keyless Tenderly gateway that survived our wide-range probe), and every
> surviving (token, spender) pair is re-verified with a live allowance() call —
> failed re-checks fail CLOSED, flagged unverified, never silently "revoked". War
> story: providers now 429 fat JSON-RPC batches, which silently amputated heavy
> wallets' mainnet data — so allowance re-checks ride Multicall3 with hand-encoded
> tryAggregate calldata (~300 checks per eth_call) and quota-aware backoff. That
> one change took vitalik.eth from "0 wounds" to the true 2,166. The guardian
> AlarmEngine polls top-pool TVL through the gateway (source-agnostic by design —
> a composed Substreams sink drops in without touching detection) and fires on
> sharp outflows, cross-referenced against your own scan.
>
> **The seal (0G).** Hard rule from day one: the app imports zero 0G SDKs — all 0G
> traffic goes through SEAL, our standalone MCP server (8 tools: TEE inference with
> per-response signature verification, encrypted Storage memory, chain calls,
> Agentic ID mint). The judge pipeline is live in production: report → slimmed
> surfaces + deterministic reference → TEE (qwen2.5-omni-7b) → parseVerdict, which
> recomputes the rubric math and REJECTS off-rubric output → scoreHash attested in
> CookedRegistry on Galileo. Sealing refuses to run if the on-chain rubricHash
> differs from local rubric.md, and an identical verdict recovers its original tx
> from the Attested event log (idempotence via logs — no double-attest). Hacky brag:
> stub mode emits self-consistent fake attestations that seal_verify genuinely
> validates and rejects when tampered, so we built everything against the stub and
> flipped to live 0G without changing agent code.
>
> **The leash (World).** The Surgeon's authority is real, not UI: the server checks
> its wallet against AgentBook on World Chain (@worldcoin/agentkit) and 402s until
> a human backs it; the frontend re-asserts the check at OPERATE-click time. It
> never holds keys — it prepares approve(spender, 0) transactions and the human
> signs each one. Selfie Check keeps the backing fresh daily; Identity Check gates
> recourse on exactly two booleans, stores nothing.
>
> Other bits we like: demo wallets (real drain victims — jaredfromsubway.eth,
> 0xSifu) pre-scanned into a pinned cache so live demos answer in <1s and
> pre-sealed on-chain; share links (/r/<addr>) with server-rendered 1200×630
> verdict cards (SVG → sharp) so X previews your CHARCOAL; a 41s in-app guided
> tour recorded from the live product; 27-assertion Playwright suite that runs
> against production after every deploy.

