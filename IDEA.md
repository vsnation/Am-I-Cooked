# AM I COOKED?

> **"Spotify Wrapped for your worst financial decisions — except it can fix them"**

*ETHGlobal Lisbon 2026*

---

## Preface: why this repo starts a day late

We did not write a single line of code on kickoff day, and that was a deliberate act of product research.

We landed in Lisbon tired. And you cannot build an app about *doneness* without field work — so in the evening we went to a restaurant and ate a steak, slowly, studying every band from rare to charcoal to feel the full juice of the idea. Then we warmed up our community with the concept, and went to sleep on it, because of an old Russian proverb: **утро вечера мудренее** — *"the morning is wiser than the evening."*

The morning agreed. Here is the idea, rested and medium rare. Everything in this repo was built after that steak.

---

## The problem

Everyone got cooked this year. The only question is *how much*.

Every wallet carries scars: the protocol that rugged, the approval you granted in 2024 and forgot, the leveraged position that ended your villain origin story on March 14. Two kinds of damage hide in there:

- **Grief** — money that is already gone. You can't fix it, but you can own it.
- **Live danger** — dangling token approvals and risky positions that are *still armed*, waiting for the next exploit.

Nobody audits their own wallet, because audits are boring and shame is private. So the danger just sits there.

## The idea

**AM I COOKED?** turns the wallet autopsy into something people *want* to run — and share.

Paste any address. The app scans dozens of lending markets, DEXes, and approval logs live via The Graph, and an AI coroner delivers the verdict: a **doneness score from 0 to 100**, stamped on a share card, with an epitaph like:

> *"You paid €900 to be exploited by a protocol named after a dog."*

That's the hook. But roasting is only half the product. The score comes with 🔪 **knives still in** — your live, fixable exposure, counted in real euros. One tap summons **the Surgeon**: an AI agent that diagnoses each wound, prescribes the fix, and *prepares* the revocation transactions. You sign them yourself. Re-scan, and the score drops:

> *"Was 68%, now 31%. Both knives out. €4,120 of live danger defused in 40 seconds. The Surgeon sends their regards."*

**Misery is the loop in. Recovery is the loop back.** The first card spreads because shared self-deprecation is communal, not humiliating. The second card exists because the product actually *acts* — and "was / now" is the only flex that proves it.

## The doneness scale

Five bands, named like steak, colored like heat. The band color is the share card's background — a feed full of these reads as a doneness chart of the whole market.

| Band | Score | The coroner's register |
|---|---|---|
| **Rare** | 0–20 | "Statistically suspicious. Nobody is this lucky." |
| **Medium rare** | 21–40 | "Singed. You touched the pan but let go in time." |
| **Medium well** | 41–60 | "You've been marinating in bad decisions since 2024." |
| **Cooked** | 61–80 | "The smoke alarm has your address memorized." |
| **Charcoal** | 81–100 | "Forensics identified your portfolio by dental records." |

Comparison is the viral payload: the card says *"more cooked than 84% of wallets scanned"* — a percentile out-shares any absolute number.

## Voice law

Every pixel of UI copy and the judge prompt itself obey one rule: **brutal on the numbers, gentle on the person.** Mock the luck, the protocol, the year — never the human. The reader is the survivor, not the punchline. This app is a war buddy, not a bully. That's the difference between a card people share and a card people close.

## The Surgeon: an agent with authority, not keys

The scariest question about any financial AI agent is *"it holds my private key?!"* — so the answer is baked into the architecture:

- **The Surgeon never holds keys.** It diagnoses, prescribes, and prepares transactions. The human signs every one in World App.
- **Authority is human-backed.** Destructive actions (revoking approvals, closing positions) are gated behind World's Selfie Check — a live human, verified, is behind every scalpel. An anonymous agent gets blocked; a Selfie-backed one operates.
- **Authority expires.** Let your daily liveness check lapse and *"your Surgeon went off duty — 2 wounds reopened."* The credential visibly sustains the agent's power, not just unlocks it once.

## Privacy: an honest line

The verdict is computed inside a **TEE on 0G Compute** — private, verifiable inference, with the scoring rubric hash-committed and the attestation anchored on-chain. Graph queries run client-side; nothing is logged.

So the claim is exactly this, no more: **"Scored inside a TEE. Your address never touches our servers."** Tap the wax seal on any card and it opens the receipts: TEE proof, registry transaction, committed rubric.

## The brand: a coroner's report filed from a kitchen

The kitchen supplies the heat, the doneness, the dial. The morgue supplies the form, the stamp, the verdict. The knife bridges both — a chef's knife and a scalpel are the same object, which is why *"two knives are still in"* works. Three marks, one system:

- **The Patient** — a serene figure sitting in a frying pan over open flame. The mascot; the app is on their side against their luck.
- **The Dial** — an oven knob whose five settings are the five bands. The app icon and the score gauge itself.
- **The Seal** — wax over the verdict, stamped with a scalpel. The trust surface: tap to verify.

## What's in the box

```
am-i-cooked/
├── apps/web/              # the app: scan → verdict → surgery → recovery card
├── packages/seal/         # standalone SDK: sealed AI inference on 0G Compute
│                          #   (TEE scoring, attestation, encrypted memory)
└── packages/cooked-skill/ # the autopsy engine as a reusable AI skill —
                           #   wallet forensics over The Graph for any agent
```

Every number in the product is live chain data — balances, positions, approvals — pulled from The Graph's standardized subgraphs across lending and DEX protocols. The incident knowledge base is curated metadata; nothing is mocked.

---

*Everyone got cooked this year. Paste your address and find out how much — then get the knives out.*
