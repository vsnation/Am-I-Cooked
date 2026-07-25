# World testing docs

Mandatory deliverable for both World beta tracks (see ORG.md):

- [`dev-feedback-log.md`](dev-feedback-log.md) — SDK friction logged live during
  MiniKit / Selfie Check / Identity Check integration. Append entries as they happen.
- [`venue-walk-form.md`](venue-walk-form.md) — ~20-person anonymous user test run at the
  venue between builds (Sat evening). Walker script, per-tester rows, tally.

## Data minimization

Am I Cooked uses World primitives for exactly two boolean facts and nothing more:
**(1) jurisdiction eligibility** and **(2) 18+** via Identity Check, plus a Selfie Check
boolean to gate the OPERATE (revoke) flow. The app never receives or stores biometric
data, World ID payloads beyond the verification booleans, or any linkage between a
tester and a wallet. Verification results are consumed in-session and are not persisted:
a page reload requires re-verification. User testing follows the same rule — anonymous
tester numbers only, no personal data on any form.
