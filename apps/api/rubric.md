# AM I COOKED? — Sealed Judge Rubric v1

This file is the canonical scoring rubric. Its keccak256 (of the exact git blob bytes,
LF line endings) is the `rubricHash` committed immutably in the `CookedRegistry`
constructor at deploy time — the judge's rules are fixed before any wallet is scored.

## Input

The autopsy report produced by the cooked-skill library: `surfaces.lending`,
`surfaces.dex`, `surfaces.incidents`, `surfaces.ghost`, `surfaces.behavioral`,
`surfaces.approvals` for one EVM address.

## Components and weights

Final score = round(wounds×0.40 + exploitExposure×0.25 + ghostPortfolio×0.20 + behavioral×0.15).
Each component is an integer 0–100.

1. **Open wounds — 0.40.** From the approvals surface's wound list (`items`; `wounds`
   in the single-chain form). Each wound carries a `risk` tier assigned by the feed:
   `critical` = spender or token matches the incident registry at address level;
   `high` = unlimited (max-allowance) approval to an unrecognized contract;
   `medium` = unlimited approval to a well-known labeled router, or a bounded approval
   granted over two years ago and never revoked; `low` = any other surviving approval.
   wounds = min(100, max(70 if any critical wound else 0,
   55×critical + 18×high + 8×medium + 3×low)).
   If the approvals surface is missing, reports `pending-feed` or `unavailable`, or
   scanned zero chains, the component is 0 and `approvals(40%)` MUST appear in
   `pendingFeeds`.
2. **Exploit exposure — 0.25.** min(100, 34 × count of incident-registry matches in the
   wallet's observed universe of markets, pools and traded tokens).
3. **Ghost portfolio — 0.20.** min(100, 45 × count of ghost items: LP positions in pools
   with TVL under $10,000, and positions in protocols the registry marks `gone`).
4. **Behavioral — 0.15.** min(100, round(4 × ratio)), where ratio = the largest single
   swap on the wallet's worst day divided by the wallet's median swap size. Fewer than
   3 swaps → 0 with note "not enough swap history".

## Missing-surface rule

A missing surface, a surface reporting `pending-feed` or `unavailable`, and an approvals
surface that scanned zero chains all contribute exactly 0 to their component, are listed
in `pendingFeeds`, and force `partial: true`. Weights are NEVER renormalized — a partial
scan can only under-report doneness, never inflate it. Chains the approvals feed skipped
for time appear in the surface's `skipped` list; skipped chains alone do not make the
verdict partial.

## Bands

score ≤ 20 → RARE · ≤ 40 → MEDIUM RARE · ≤ 60 → MEDIUM WELL · ≤ 80 → COOKED · ≤ 100 → CHARCOAL

## Output

The judge returns ONLY this JSON object, no prose around it:

```
{ "rubricVersion": "v1", "address": "<0x…>", "score": <0-100>, "band": "<band>",
  "partial": <bool>, "pendingFeeds": ["…"],
  "components": { "wounds": n, "exploitExposure": n, "ghostPortfolio": n, "behavioral": n },
  "evidence": ["<one short factual line per non-zero component>"],
  "roast": "<one line, ≤140 chars, dark humor about the numbers>" }
```

## Conduct

The roast mocks the data, never the person; no slurs, no doxxing. The verdict is a
diagnosis of on-chain state — the judge gives NO financial advice, price predictions or
recommendations. Evidence lines cite only facts present in the input surfaces.
