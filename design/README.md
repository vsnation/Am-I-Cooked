# design — three directions for apps/web

Three alternatives to the shipped prototype (`apps/web/index.html`, v7), built on the **same
four screens and the same copy** so the comparison is about design, not content. Each file is
standalone: no build, no fonts, no network. Open it in a browser.

| File | Direction | The bet |
|---|---|---|
| `a-paperwork.html` | **The Paperwork** — printed coroner's form, cream stock, rubber stamp | Light and quiet in a feed of dark crypto apps |
| `b-appliance.html` | **The Appliance** — graphite hardware panel, five-detent oven knob | The knob turning IV → II *is* the recovery story |
| `c-evidence.html` | **The Evidence Log** — monospace forensic terminal, no mascot | Credibility spreads further than cuteness |

Each page shows all four screens side by side (intake → verdict → surgeon → discharge) plus a
short rationale with the palette, type roles, the deliberate risk and the trade-off.

## How v7 compares

v7 is a dark kitchen/morgue hybrid: charcoal ground, ember glow, animated needle, mascot in a
pan, emoji throughout. It already works. These three each drop one of its pillars on purpose —
A drops the darkness and the emoji, B drops the paper metaphor for physical hardware, C drops
the mascot and the dial entirely — so that picking one is a decision about **which pillar the
brand actually rests on**, not a preference between palettes.

## Choosing

Score them against the three things that decide the weekend, not against taste:

1. **Demo theatre** — what does the 4-minute video look like in this direction? (B is strongest,
   A is weakest: nothing moves.)
2. **Share card** — the viral payload is a screenshot in a feed. Which one survives being
   thumbnail-sized? (A and B; C is text-dense.)
3. **Trust questions** — judges will ask about keys, the TEE and the agent's authority. Which
   direction makes the answer look obvious? (C, then B.)

A hybrid is legitimate and probably the real answer: v7's dark ground with C's evidence density
for the findings list, or A's stamp for the verdict moment. Nothing here is all-or-nothing.

## Next

Applying the chosen direction to `apps/web` is a separate queue task — these are mockups, they
share no CSS with the app. Bump `V = 'cooked-vN'` in `apps/web/sw.js` when the real app changes,
or installed PWAs keep serving the cached build.
