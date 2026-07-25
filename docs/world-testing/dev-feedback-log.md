# World SDK — developer feedback log

Mandatory World-track deliverable: log SDK friction **while** integrating, not from memory
afterwards. One entry per friction point, appended at the moment it happens (copy the
template block). Cover: MiniKit, Selfie Check, Identity Check, Mini App packaging, World App
signing. Wins go in too — "worked first try" is feedback.

Entry template:

```
### <short title>
- when: 2026-07-25 HH:MM
- component: MiniKit | Selfie Check | Identity Check | Mini App packaging | World App signing | docs
- task: <what we were trying to do, one line>
- expected: <what the docs / API surface suggested would happen>
- actual: <what happened — exact error text if any>
- severity: blocker | slowed-us-down | papercut | praise
- workaround: <what we did about it, or "none — still blocked">
- docs gap: <what one sentence in the docs would have saved us, or "n/a">
```

---

## Entries

### AgentKit human-backing path is easy to confuse with IDKit orb-verify
- when: 2026-07-25 14:10
- component: AgentKit / docs
- task: make the Surgeon agent "human-backed" so it may propose revocations
- expected: from the docs' framing we assumed we needed a World App ID + the classic
  IDKit orb-verify widget in the app, like a normal proof-of-human
- actual: that's the wrong path. AgentKit backing is its own flow — register the agent
  WALLET in AgentBook via the CLI, a human approves it in World App, and the backend
  verifies standing with `createAgentBookVerifier()`. No App ID, no IDKit widget for
  the backing itself. Selfie/Identity Checks are the ones that use the Developer Portal.
- severity: slowed-us-down (~half a day)
- workaround: split the two: server-side `createAgentBookVerifier()` for backing;
  `worldVerify()` (IDKit) only for the Selfie/Identity credentials
- docs gap: a "which World product do I need?" table at the top of the AgentKit page —
  backing (AgentBook/CLI) ≠ proof-of-human widget ≠ Portal credential checks

### Server-side authority gate: 402 until backed
- when: 2026-07-25 14:35
- component: AgentKit
- task: express the authority ladder as a real API contract, not UI state
- expected: a clean way to answer "is this agent allowed to act yet?"
- actual: `createAgentBookVerifier()` + a per-request check works well; we return HTTP
  402 from `/surgeon/authorize` until backing is verified, and re-assert at action time
- severity: praise
- workaround: n/a — worked once the backing path (above) was understood
- docs gap: an example showing the verifier used as a server-side gate (not just client)

### worldVerify() for Selfie Check — clean once wired
- when: 2026-07-25 16:20
- component: Selfie Check
- task: gate the OPERATE action on a live selfie credential in-app
- expected: a callable that returns a verifiable result we can check server-side
- actual: `worldVerify('selfie')` opens the flow and returns cleanly; we map success to
  a 24h ON-DUTY window and re-require daily (liveness sustains authority)
- severity: praise
- workaround: n/a
- docs gap: state the credential's freshness/expiry semantics so teams know how long a
  pass is valid before they design their own renewal cadence

### Identity Check — attribute set + data-minimization intent
- when: 2026-07-25 16:45
- component: Identity Check
- task: gate jurisdiction-aware recourse on the minimum attributes
- expected: request exactly two attributes (jurisdiction, 18+) and store nothing
- actual: `worldVerify('identity')` covers it; we consume two booleans and persist none
- severity: slowed-us-down (papercut)
- workaround: verify client-side, act on the booleans, never write them down
- docs gap: an explicit "request the narrowest attribute" example + guidance on NOT
  persisting attestation payloads (the privacy-first default should be the sample code)
