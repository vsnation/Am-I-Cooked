# Loom narration scripts — three track videos

*Play the mp4 in Loom, record your voice over it. Timestamps are approximate — each
line describes what's on screen so you can pace naturally. Conversational beats
~130 words/min; pause where the dots are.*

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

## 3 · WORLD — `world-demo.mp4` (2:13)

**0:00 – landing.** "An AI agent that can revoke and move your funds is exactly the
thing crypto users are afraid of. So we built the leash before we built the knife.
This is our World story."

**0:08 – scanning jaredfromsubway.eth.** "First, diagnosis: this is the wallet that
lost seven and a half million dollars to a dangling approval. We scan it live."

**0:18 – agent card, authority NONE.** "Meet the Surgeon. It has on-chain credentials
— but look at its authority: NONE. Anonymous. And that's not a label, it's enforced."

**0:27 – interlock.** "This blocked state IS the product. Anonymous agents may
diagnose — never cut. A verified human must stand behind every signature this agent
proposes. That's the AgentKit authority ladder."

**0:36 – World ID widget opens.** "And when I tap verify — this is REAL. A live World
ID Selfie Check, right in the app: scan with World App, and a live human arms the
agent. The agent's AgentBook registration is read alongside as its credential."

**0:49 – widget closed, interlock holds.** "I'm not going to scan on camera — and
look: no scan, no scalpel. The interlock holds. The system fails SAFE."

**0:59 – revoke queue.** "Even fully armed, the agent's power has a ceiling: it only
PREPARES the revoke transactions — approve spender zero, batched, about forty cents
of gas."

**1:07 – 'you sign in World App'.** "The signature never leaves the human. The agent
proposes; you decide, in your own wallet."

**1:16 – selfie sustain.** "Authority isn't a cookie, either. The Selfie Check renews
DAILY — let it lapse and the Surgeon goes dormant."

**1:24 – recourse modal.** "And if you were already robbed: a jurisdiction-aware
recourse panel, gated by exactly two booleans — where you are, and that you're an
adult. Nothing else asked. Nothing stored."

**1:34 – end slate.** "The ladder: anonymous diagnoses, human-backed proposes, the
human signs. Selfie liveness sustains it, Identity Check respects your privacy. An
agent with knives — and a human holding the leash. AM I COOKED, with World."
