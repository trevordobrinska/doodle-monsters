# 04: Flick

**What to build:** During a Catch, a quick swipe across the moving Monster is a Flick. It flings the Monster into a wall and counts as two Bonks.

**Blocked by:** 03 (First Catch).

**Status:** ready-for-agent

- [x] Rendering layer tells a tap from a quick swipe and sends Flick events with the swipe path; the thresholds live in this layer
- [x] Core: a Flick whose path crosses the moving Monster adds two steps of Dizzy and sends it flying in the swipe direction until it hits a wall
- [x] Core: a Flick while Stunned adds no Dizzy (same rule as a Bonk); a Flick that misses does nothing
- [x] Core tests for "a Flick adds two steps", "a Flick that misses does nothing" and "a Flick while Stunned adds nothing"
- [x] The wall hit has a visible bump (squash against the wall)
- [ ] Playtested in Chrome's device toolbar: taps aren't mistaken for Flicks and vice versa

## Comments

**2026-11-07 (agent):** Code done. The core has a new `flick(path)` (`src/core/gameCore.ts`), and 8 tests in `src/core/flick.test.ts` drive it through `flick` + `tick`. The gesture layer in `src/input/gestures.ts` holds the thresholds, and `main.ts` wires it up. The renderer draws a swoosh trail, "FLICK!", stretch while flying, and a squash against the wall with "THUD!". Starting numbers: flight at 1600 px/s; a tap is under 24 px of finger travel; a Flick is at least 60 px within 350 ms. Decisions made along the way:
- A Flick is +2 Dizzy, capped at full. On a fully Dizzy Monster a Flick catches it, just like a tap. The spec only says "one more tap", so this needs a yes or no.
- The flung Monster flies until it touches the first wall, is Stunned there for the usual time, then dashes. Taps and Flicks while it's flying "boing".
- A finger is judged when it lifts, because that's the only way to tell a tap from a swipe. So Bonks now land on finger-up, not finger-down. Moves of 24–60 px, and slow drags, do nothing.

Still open: a human needs to playtest in Chrome's device toolbar. Things to watch: does the finger-up Bonk feel late? Are taps ever taken for Flicks, or Flicks for taps? The hit-test checks the whole swipe path against where the Monster is when the finger lifts, and the Monster can move about 100–200 px during a 350 ms swipe. If good swipes miss, check each part of the path against where the Monster was at that moment.
