# 03: First Catch with the placeholder Monster

**What to build:** A kid can Catch the placeholder blob from start to finish. Tapping it while it moves is a Bonk: it squashes with stars and gets more Dizzy. Then it's Stunned for about a second (extra taps just "boing" with no penalty), then dashes off faster in a random direction. Dizzy drains if the kid goes a few seconds without a Bonk. When fully Dizzy it gets spiral eyes, and one more tap catches it in a bubble. A Catch can't fail: after about 2 minutes the Monster gets sleepy and slows down. Use glossary terms throughout.

**Blocked by:** 01 (Walking skeleton).

**Status:** ready-for-agent

- [x] Core: a tap that hits the moving Monster is a Bonk and adds one step of Dizzy; a miss does nothing
- [x] Core: after a Bonk the Monster is Stunned for about 1 s, and taps during that window don't add Dizzy
- [x] Core: when Stunned ends, the Monster dashes faster in a random direction (from the injected dice)
- [x] Core: Dizzy drains after a few seconds without a Bonk
- [x] Core: at full Dizzy the Monster is ready to be caught, and one more tap catches it
- [x] Core: after about 2 minutes the Monster gets sleepy and moves slower
- [x] Each rule above has a test through the core's interface (events + `tick(dt)`), with no rendering in tests
- [x] Renderer: squash and stretch with stars on a Bonk, wobble while Stunned, a visible Dizzy meter, spiral eyes at full Dizzy, the bubble on catch
- [x] Rendering layer turns pointer events into Bonk events; hit-testing is done by the core
- [ ] A normal Catch takes roughly 30â€“60 s when playtested in Chrome's device toolbar (tuning numbers are starting points)

## Comments

**2026-11-07 (agent):** Code done. The core rules live in `src/core/gameCore.ts` and are tested in `src/core/catch.test.ts` (13 tests, all through `bonk(at)` + `tick(dt)`). The placeholder "blob" is now called Monster. The renderer draws squash and stretch, stars, the Stunned wobble with orbiting stars, a pip-style Dizzy meter, spiral eyes, the bubble, plus droopy eyes and "z" when sleepy. Pointer-to-Bonk wiring is in `src/main.ts`. Starting numbers: 6 steps to full Dizzy, 1 s Stunned, a dash of +80% speed that fades over 1.5 s, drain after 3 s then 1 step per 1.5 s, sleepy at 120 s easing to half speed, 16 px of touch slack. Decisions made along the way:
- A fully Dizzy Monster stops draining and waits for its catching tap ("a Catch can't fail"). This rule isn't in the spec, and a test pins it.
- The catching tap only works once the last Stunned ends.
- Placeholder until the Round exists: tapping 1.5 s after a catch starts a new Catch, and the browser console logs "Caught in N s" to help with tuning.

Still open: a human needs to playtest the 30–60 s target in Chrome's device toolbar. The review also noted that gesture handling (`main.ts`) needs a proper home when Flick arrives in ticket 04.

