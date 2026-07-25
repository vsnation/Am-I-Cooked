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
