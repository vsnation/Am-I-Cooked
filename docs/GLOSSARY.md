# AM I COOKED? — terms in plain English

**The theme:** the app is a "doctor for your wallet." It does an autopsy, finds the
wounds, and a surgeon fixes them. Every fancy word maps to something simple.

## The core idea
- **Cooked / "how cooked are you"** — how much danger your wallet is in. 0 = safe, 100 = toast.
- **Autopsy / Autopsy Report** — the full health-check of your wallet: everything risky, in one scan.
- **Cooked score (0–100)** — one number for your total risk.
- **The bands** (like steak doneness): **Rare** = safe · **Medium Rare** · **Medium Well** · **Cooked** · **Charcoal** = very exposed.

## What the scan finds
- **Approval / allowance** — permission you once gave a protocol to spend your tokens.
- **Unlimited approval** — that permission with *no limit* — the most dangerous kind.
- **Open wounds** — approvals that are *still active right now*, so a contract could move your tokens today, no signature needed.
- **Exploit exposure** — protocols you used that later got hacked.
- **Ghost portfolio** — money you forgot: funds left in dead/abandoned protocols ("cash in last year's jacket").
- **Your biggest day** — the day this wallet moved the most money.

## The fix
- **The Surgeon** — the AI agent that fixes your wallet.
- **Revoke** — cancel a dangerous approval (technically it sends `approve(spender, 0)` = "you can spend zero of mine").
- **"Want the knives out" / knives** — start the fixing (revoking).
- **Discharge** — the "you're patched up" screen after fixing, with your recovery.

## The trust part (0G)
- **Sealed / the seal / sealed verdict** — the score was computed inside a locked, private box and its proof was written to the blockchain, so you can check it's real and untampered.
- **TEE / secure enclave** — that locked private box the AI runs in.
- **Attestation / attested / on-chain** — a receipt on the blockchain proving where and how the verdict was made. "Tap the seal" opens that receipt on the explorer.
- **Rubric / rubric hash** — the scoring rulebook. Its fingerprint is locked on-chain *before launch*, so nobody (including us) can quietly change the rules.
- **Agentic ID** — the Surgeon's ID card, registered on the blockchain.
- **SEAL** — our plug that connects any app to 0G's private-AI features in one line.

## The safety part (World)
- **Human-backed** — a real, verified person vouches for the agent (via World's **AgentBook**).
- **Selfie Check** — a quick face check that must be repeated daily to keep the agent allowed to act.
- **Identity Check** — proves two facts about you (your region + that you're an adult) and stores nothing else — used to show the right recourse after a hack.

## The watchdog (The Graph)
- **The Graph** — where the app reads all your live on-chain history from. It's our "database."
- **Guardian / live alarm** — watches DeFi in real time; if a protocol you're in starts getting drained, it warns you *before* you're hit.

---
**One sentence for a judge:** "It scans your wallet for forgotten dangerous permissions,
proves the verdict on-chain so you can trust it, and a human-approved agent helps you
cancel the risky ones before you get drained."
