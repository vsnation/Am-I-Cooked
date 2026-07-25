# Loom narration scripts

*One flagship submission cut + three per-track cuts. All 780×1688 (>720p).*

*Play the mp4 in Loom, record your voice over it. Timestamps are approximate — each
line describes what's on screen so you can pace naturally. Conversational beats
~130 words/min; pause where the dots are.*

---

---

## 0 · FINAL SUBMISSION DEMO — `final-demo.mp4` (2:53)

*The flagship cut — all three sponsors in one arc. `[ … ]` = pause / let the screen
breathe. `(beat)` = short half-second stop. Read ~125 wpm; there's slack built in.*

**0:00 — landing.** "This is AM I COOKED — a sixty-second autopsy for your crypto
wallet." [ … ] "Everyone got cooked this year. The only question is how much."

**0:12 — typing the address.** "So let's find out. This wallet lost seven and a half
million dollars — to an approval it forgot to revoke." (beat) "No wallet connect. No
signatures. You just paste an address."

**0:24 — RUN, scanning.** "And in seconds, The Graph gives us the whole picture —
every lending market, every DEX, every pool this wallet ever touched." [ … ]

**0:34 — drained protocols.** "First: the protocols it used that later got hacked —
matched against a hundred and seventy-seven real incidents." (beat) "With receipts."

**0:44 — open wounds.** "Then the dangerous part: live approvals that can drain this
wallet TODAY — no signature needed — traced across twenty-one chains." [ … ]

**0:55 — ghost portfolio.** "And the fun part: money it forgot it had. Like finding
cash in last year's jacket."

**1:03 — the verdict stamp.** "That becomes a score." (beat) "But here's what makes
it different — this score wasn't computed by our server." [ … ] "An AI judge issued
it, inside a 0G Compute TEE."

**1:15 — tap the seal.** "So don't take our word for it." (beat) "Tap the seal.
Here's the real attestation — the TEE signature, verified. The score hash. And the
transaction that anchored it on-chain." [ … ]

**1:30 — the explorer.** "And there it is. On the 0G explorer. Status: success. Our
registry contract. Anyone can open this — mid-demo, right now." (beat) "You don't
trust the score. You verify it." [ … ]

**1:45 — back in the app, guardian.** "But a coroner tells you how you died. We built
a smoke detector." [ … ] "The guardian watches DeFi liquidity in real time — a
second Graph feed."

**1:56 — the alarm fires.** "And when a protocol you're exposed to starts draining —"
(beat) "— the alarm goes off. This is a labeled replay of a real drain." [ … ]
"Revoke before it reaches you, not after."

**2:08 — the Surgeon, authority NONE.** "So we fix it. Meet the Surgeon — an on-chain
agent." (beat) "But look: authority, none. Because an AI that can move your funds is
exactly what you're afraid of."

**2:20 — World ID / connect.** "So it stays locked until a real human backs it — a
live World ID check." [ … ] "Scan, connect —" (beat) "— connected. A verified human
now stands behind the agent."

**2:34 — you sign / OPERATE / discharge.** "And even now, it only proposes. The human
signs every transaction." (beat) "Operate — the wounds close —" [ … ] "and discharge:
sixty-eight percent, down to thirty-one. The comeback card, not the shame card."

**2:48 — end slate.** "The Graph finds it. 0G proves it. World makes the fix safe."
(beat) "AM I COOKED — live at tracely-dot-live-slash-cooked."

*Total spoken ≈ 2:50 with the pauses. If you run long, the safe cuts are the ghost-
portfolio line (0:55) and one of the two 'verify it' beats.*

---

## 1 · THE GRAPH — `graph-demo.mp4` (2:18)

**0:00 – landing.** "This is AM I COOKED — a sixty-second wallet autopsy. Everything
you're about to see on screen is live data from The Graph. Let me show you what's
under the hood."

**0:06 – registry code card.** "This little list is our ENTIRE lending integration.
Because Aave, Compound and Spark all publish Messari standardized subgraphs, we wrote
ONE query — and adding protocol number four is one line of config, not a sprint.
That's the standardized-schema pitch, in four lines of code."

**0:22 – typing vitalik.eth, RUN.** "Let's scan vitalik.eth. No wallet connect, no
signatures — just paste."

**0:30 – scanning.** "Right now, in real time: positions from Aave, Compound and Spark
through one standardized query… LPs and swap history from Uniswap v3… about a third
of a second through the Graph gateway. Zero mocks anywhere."

**0:40 – drained protocols row.** "Every row of this report is Graph data. Drained
protocols: we take the wallet's universe — every market, pool and token The Graph
found — and cross it against 177 documented hacks."

**0:49 – open wounds row.** "One honest footnote: this row, live approvals, is raw
RPC — the ONE surface that isn't The Graph. We're precise about which is which."

**0:57 – ghost portfolio.** "Ghost portfolio — money forgotten in dead pools. Pool
TVL straight from the Uniswap v3 subgraph."

**1:05 – biggest day.** "Your biggest day — swap history from the subgraph, compared
against the wallet's own median."

**1:13 – verdict stamp.** "Then an AI judge reasons over all of these Graph surfaces —
and seals the verdict in a TEE. That's the AI-use-case story: the agent doesn't print
query results, it acts on them."

**1:22 – guardian + alarm fires.** "And this is my favorite part. The guardian polls a
SECOND Graph product — live pool TVL — every fifteen seconds. Watch the top of the
screen: that's a replay of a real drain, clearly labeled… TVL drops past the
threshold… and the alarm fires. Risk monitoring, personalized to your own scan."

**1:41 – surgeon.** "Findings become prepared revoke transactions. The Graph finds it,
the agent proposes the fix, a human signs."

**1:51 – end slate.** "So: one standardized query across the whole DeFi map, two Graph
products composed, an agent that reasons and acts — and the same intelligence shipped
as cooked-skill, an MCP any agent can mount with one config block. AM I COOKED,
live at tracely-dot-live-slash-cooked."

---

## 2 · 0G — `0g-demo.mp4` (2:25)

**0:00 – landing.** "Every wallet checker asks you to trust its verdict. Ours asks you
to VERIFY it. This is AM I COOKED on 0G — let me prove a verdict on-chain, live."

**0:08 – scan runs.** "We scan vitalik.eth. The app builds the risk surfaces, then
hands them to a judge we deliberately CANNOT tamper with."

**0:21 – the stamp.** "This score wasn't computed by our server. A judge running
inside a 0G Compute TEE issued it — and the rules it follows are frozen: the scoring
rubric's hash was committed on-chain at deploy. If our rubric file ever drifts from
the on-chain hash, sealing refuses to run."

**0:33 – seal modal.** "Tap the wax seal. This is the real attestation: the model —
qwen 2.5 running in the TEE — the response signature, verified… the score hash… and
the registry transaction. Nothing on this screen is staged."

**0:46 – ring on the tx.** "That transaction is real. Don't take my word for it —"

**0:52 – EXPLORER PAGE.** "— here it is on the 0G explorer. Status: success. From: our
SEAL wallet. To: the CookedRegistry contract. Twelve thousand confirmations. Any
judge, any user can open this mid-demo. The verdict is anchored."

**1:05 – back in app, surgeon.** "The agent that fixes your wallet isn't anonymous
code either. The Surgeon holds 0G Agentic ID number two — minted on-chain, with its
metadata encrypted in 0G Storage."

**1:20 – SEAL story.** "And here's the infrastructure play: our app imports ZERO 0G
SDKs. Every 0G capability — TEE inference, encrypted memory, chain calls, identity —
flows through SEAL, our eight-tool MCP server. One config line gives ANY AI client
private inference with proof of every answer. We built the whole product on it."

**1:35 – end slate.** "TEE judge. On-chain seal. Agentic identity. Encrypted memory.
All live, all verifiable while you watch. AM I COOKED, on 0G."

---

## 3 · WORLD — `world-demo.mp4` (2:25)

**0:00 – landing.** "An AI agent that can revoke and move your funds is exactly the
thing crypto users are afraid of. So we built the leash before we built the knife.
This is our World story."

**0:08 – scanning jaredfromsubway.eth.** "First, diagnosis: this is the wallet that
lost seven and a half million dollars to a dangling approval. We scan it live."

**0:18 – agent card, authority NONE.** "Meet the Surgeon. It has on-chain
credentials — but look at its authority: NONE. Anonymous. And that's enforced, not
decorative."

**0:27 – interlock.** "This blocked state IS the product. Anonymous agents may
diagnose — never cut. That's the AgentKit authority ladder."

**0:36 – World ID widget opens.** "When I tap verify — this is real: a live World ID
Selfie Check, right in the app."

**0:45 – QR card.** "You scan the code with World App — I'll simulate the rest for
the camera, it says so right on screen."

**0:52 – connecting… connected.** "Connecting… and connected. A live human now backs
the agent. Selfie Check passed, authority granted."

**1:03 – interlock opens (demo label).** "The interlock opens — authority: REVOKE.
Notice the label: this arm is the demo path; the live gate needs the real scan."

**1:10 – revoke queue.** "Now the ceiling on its power: even armed, the agent only
PREPARES the revokes — approve spender zero, batched, forty cents of gas."

**1:18 – 'you sign in World App'.** "The signature never leaves the human. The agent
proposes; you decide."

**1:26 – OPERATE, wounds healing.** "So let's operate. The staged surgery closes the
wounds one by one — no wallet on this machine, and the screen says so."

**1:36 – DISCHARGE.** "And the final result: discharge papers. Sixty-eight percent
cooked becomes thirty-one — medium rare. The recovery graph, the healed dial, and
the card people actually share: not the shame — the comeback."

**1:48 – selfie sustain.** "One more thing: authority isn't a cookie. The Selfie
Check renews DAILY — lapse, and the Surgeon goes dormant."

**1:56 – recourse modal.** "And if you were already robbed: jurisdiction-aware
recourse, gated by exactly two booleans — where you are, and that you're an adult.
Nothing else asked. Nothing stored."

**2:06 – end slate.** "The ladder: anonymous diagnoses, human-backed proposes, the
human signs. An agent with knives — and a human holding the leash. AM I COOKED,
with World."

---

## 4b · THE GRAPH · AI TOOLING (cooked-skill MCP) — voiceover script

*For the AI Tooling / MCP judges (and the Substreams team). Record over a screen
capture of an AI client (Claude/Cursor) with cooked-skill mounted. `[ … ]` = pause,
`(beat)` = short stop. HONEST SCOPE: this pitches our MCP's one-prompt end-to-end
answer — NOT a Substreams deployment, which we did not build.*

**Open.** "Your track asks: make The Graph easy to use from AI environments." [ … ]
"So we asked ourselves the question every crypto AI eventually has to answer —" (beat)
"— is this wallet dangerous?"

**The problem.** "Today, answering that means weeks of plumbing. Four subgraph
schemas. Gateway keys. Incident-data curation. Approval tracing across twenty-one
chains. A scoring model." [ … ] "Nobody should build that twice."

**The tool.** "So we built cooked-skill — an MCP server. One config block, and any
agent — Claude, Cursor, ChatGPT — gets five tools." (beat) "The agent asks in plain
language; the tool does the whole autopsy and hands back a structured risk profile.
End to end, in one prompt. The agent reasons over the answer — it never touches the
plumbing." [ … ]

**Show it.** "Watch — I paste one address, in natural language." [ … ] "And that's
live Graph gateway data — Aave, Compound, Spark on one standardized schema, Uniswap
beside them. No mocks."

**The hard parts — and what we fixed.** "Two things fought us." (beat) "One: the
schema promise had to be real. Because these are Messari standardized subgraphs, our
whole lending integration is four lines — adding a protocol is one line, not a
sprint." [ … ] "Two: the RPC batch cliff. Mid-build, providers started rejecting
large JSON-RPC batches — and our heavy-wallet scans silently dropped data. Vitalik
read zero open approvals when the real number was two thousand one hundred and
sixty-six." (beat) "We rewrote the bulk reads onto Multicall3 — three hundred checks
folded into one call — with quota-aware backoff. Zero became two-one-six-six." [ … ]

**Why it's reusable.** "The core is dependency-free and isomorphic — that's why the
same code is a library, an MCP, and the engine behind our live product. We're user
number one, in production." (beat) "And we ship a second MCP in the same repo —
zero-G as tools — because agent-mountable infrastructure is just how we build."

**Close.** "cooked-skill is the risk-profile primitive — geocoding for maps apps.
Built once, used four ways, handed to every builder." [ … ] "That's the whole point
of your track. Repo's open, SKILL-dot-M-D included."

*≈ 1:50 spoken with pauses. Stretch to 2:00+ by holding on the live tool-call output.
If you also attempt the Substreams featured challenge later, that's a SEPARATE claim —
do not fold it into this script.*

---

## 4c · COMPOSABLE / STANDARDIZED scheme — `composable-scheme.mp4` (18.7s)

*Tight voiceover to fit the animation (~45 words). `[ … ]` = short pause. If you want
to talk longer, pause playback on the "+1 line" beat and the composition strip.*

**0:00 — title + code appears.** "A wallet checker that covers two protocols tells you
you're safe —" (beat) "— while a third one drains you."

**0:06 — query fans to three.** "So we used The Graph's standardized schema. One query,
written once —" [ … ] "— runs across every protocol at once. Live."

**0:11 — the +1 line / Morpho.** "Another protocol?" (beat) "One line."

**0:14 — composition strip.** "And it composes — a second Graph product becomes a live
drain alarm." [ … ]

**0:17 — close.** "Total coverage. In an afternoon."

### Alt one-liner (if you want a single sentence over the whole clip)
"One standardized query covers the entire DeFi map, adding a protocol is one line, and
a second Graph product composes straight in — that's total coverage in an afternoon."

### On-screen text is already baked in
The clip carries its own captions (the read/understand/act line, "+1 line = +1
protocol", "$0 extra code", the composition strip). If you'd rather it be silent, it
reads on its own — the voiceover is optional polish.
