# Submission form answers

## Short description (≤100 chars)

> Spotify Wrapped for your worst DeFi decisions — TEE-scored on 0G, fixed by a human-backed agent.

(96 chars)

## Description (min 280 chars)

> Everyone got cooked this year. The only question is how much.
>
> Paste any wallet address — no connect, no signature — and AM I COOKED runs a
> cross-protocol autopsy: your exploit exposure matched against a curated incident
> registry, every dangerous token approval still open right now, dead-protocol bags,
> and your single worst day. The verdict is a cooked score from 0 to 100, stamped by
> a sealed judge running inside a 0G Compute TEE — with a real attestation you can
> tap open, and the scoring rubric hash-committed on-chain in the CookedRegistry, so
> nobody (including us) can quietly change the rules after the fact. Your address
> never touches our database; scan history lives encrypted in 0G Storage.
>
> Then comes the part Wrapped can't do: fix it. The Surgeon is an agent with a 0G
> Agentic ID that diagnoses every open wound and prepares the exact revocation
> transactions to close them — but it operates under two hard rules: it never holds
> your keys (you sign every transaction yourself), and no face, no scalpel — it may
> only act with verified human backing via World's Selfie Check, renewed daily. An
> anonymous agent asking to touch your money gets a big red BLOCKED.
>
> A guardian alarm layer watches DeFi liquidity for large outflows, so if a protocol
> you're exposed to starts draining, you get the knives out before you're hit.
> Misery goes viral (68% cooked 💀); the recovery card brings you back (68 → 31,
> €4,120 of live exposure defused). That's the card people actually share — not the
> shame, the comeback.

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

> Monorepo, three deliberate layers.
>
> **The autopsy (The Graph).** A dependency-free, isomorphic JS library that queries
> The Graph gateway using Messari standardized subgraph schemas — one query shape
> covers Aave v3, Compound v3 and Spark; adding a conforming lending market is one
> registry line. Uniswap v3 rides the same registry with its own dialect. Live
> approvals don't come from an indexer at all: we scan raw ERC-20 Approval logs via
> eth_getLogs (chunked fallback for stingy RPCs), then re-verify every surviving
> (token, spender) pair with a live allowance() call — the call is the source of
> truth, and failed re-checks fail closed rather than reading as "revoked". A
> guardian AlarmEngine polls top-pool TVL through the gateway and fires on ≥25%
> outflow in 12 minutes, matched against your personal exposure.
>
> **The seal (0G).** Hard rule we set day one: the app contains zero 0G SDK imports.
> Everything 0G goes through SEAL, our standalone MCP server (Bun + TypeScript,
> 0G Compute/Storage SDKs, ethers) exposing 8 tools: sealed TEE inference with
> per-response signature verification on Galileo, encrypted Storage memory, chain
> calls, and Agentic ID mint/load (ERC-7857 draft surface, contract + deploy
> script). The hacky bit we're proud of: stub mode emits self-consistent *fake*
> attestations that seal_verify genuinely validates and rejects when tampered — so
> we built the whole product against the stub and flipped to live 0G without
> changing agent code. CookedRegistry.sol anchors verdicts first-write-wins, with
> the scoring rubric's hash committed at deploy; the judge mirrors that rubric's
> wounds formula byte-for-byte, so a verifier can recompute the score.
>
> **The face (World).** The Surgeon's interlock follows World's human-backing model:
> Selfie Check flips it ON DUTY for 24h, it only ever *proposes* defensive
> revocations, and the human signs each one in World App (flow currently staged in
> the UI, MiniKit wiring next). Frontend is a framework-free vanilla-JS PWA
> (installable, service worker), backed by a small Node API (viem) that keeps the
> Graph key server-side and caches scans. The autopsy is also packaged as
> cooked-skill, an MCP tool, so any agent can borrow our coroner.
