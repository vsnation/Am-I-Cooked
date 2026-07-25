# World — requirements fulfillment (per track)

*Each official qualification bullet mapped to our evidence. ✓ = met, ⏳ = action left.*

Live: **https://tracely.live/cooked/** · Repo: **github.com/vsnation/Am-I-Cooked**
Agent wallet (AgentBook, World Chain): `0x00ecc9545f23e59Ee4121F246c4eC4e26eA5657A`

---

## 🤖 AgentKit — New Use Cases ($8,000)

**Requirement → evidence**
- *Uses AgentKit in a meaningful way* — ✓ `@worldcoin/agentkit`
  `createAgentBookVerifier()` gates the agent server-side (`apps/api/surgeon.js`);
  the API returns 402 until backing is real.
- *Verifies an agent is human-backed* — ✓ the Surgeon's wallet standing is checked
  against AgentBook on World Chain before it may act; `/surgeon/status` exposes the tier.
- *Working end-to-end flow, not a wrapper/static demo* — ✓ live at tracely.live/cooked:
  anonymous agent is blocked (diagnose only) → human-backed unlock → agent prepares
  `approve(spender,0)` → the human signs in their own wallet → wounds close.

**Why we are NOT in the excluded set** (this is the important note): the disqualified
patterns are agent *reputation*, human-backed *content generation*, and human-backed
*perks for agents* (API discounts, rate limits). Ours is none of those. Human-backing
here is the gate on **autonomous financial action** — an agent that can revoke token
approvals and move value is denied that power until a real human stands behind it, and
even then it only *proposes* while the human signs. That's a new **trust model —
defensive financial authority with a human circuit-breaker** — changing *authorization
and accountability* for money-moving agents, exactly the brief's target and not a perk.

**Left:** demo video (world-scheme.mp4 sent; or the app-walkthrough) · team contacts ·
the one human tap: Orb-verified approval of the agent wallet in World App.

---

## 🤳 Selfie Check Beta ($1,750)

**Requirement → evidence**
- *Uses Selfie Check meaningfully — risk/eligibility/fairness/continuity/abuse, not
  generic login* — ✓ **continuity + abuse-prevention:** a live selfie
  (`worldVerify('selfie')`) puts the agent ON DUTY for 24h and must be **renewed daily**;
  lapse → the agent goes dormant and closed wounds visibly reopen. It is explicitly NOT
  a login — you never sign in with it; it *sustains a powerful agent's authority*.
- *Testing documentation — developer AND user feedback* — DEV ✓ (`docs/world-testing/
  dev-feedback-log.md`, real entries incl. the freshness/expiry docs gap); USER ⏳
  (`venue-walk-form.md` ready — run the ~20-person walk Sat evening).
- *Working app / end-to-end prototype* — ✓ live in-app.

**Left:** run the venue walk (user-feedback half) · demo video · team contacts.

---

## 🪪 Identity Check Beta ($1,750)

**Requirement → evidence**
- *Uses Identity Attestations meaningfully — risk/eligibility/compliance/personalization/
  abuse, not generic login* — ✓ **eligibility + compliance:** after a theft the recourse
  routes depend on jurisdiction and age, so we request exactly those two attributes
  (`worldVerify('identity')`) to unlock the right guidance — not to log anyone in.
- *Testing documentation — developer AND user feedback* — DEV ✓ (dev-feedback-log.md,
  incl. the "request the narrowest attribute / don't persist payloads" gap); USER ⏳
  (venue-walk form).
- *Working prototype* — ✓ the recourse panel is live.
- *Explain why the attribute is necessary + how you minimize data* — ✓ jurisdiction
  decides which claims/report routes apply; 18+ is a legal gate on recourse. We request
  **exactly two booleans, store NOTHING**, and the routes derive from the wallet's own
  scan, not from anything about the person. Documented in `docs/world-testing/README.md`
  (data-minimization) and `world.md`.

**Left:** run the venue walk (user-feedback half) · demo video · team contacts.

---

### The one shared blocker
Both beta tracks REQUIRE user-feedback testing docs. The templates are ready and the
dev-feedback half is filled; the **~20-person venue walk is the operator action** that
completes them. Do it Sat evening → both Selfie and Identity qualify.
