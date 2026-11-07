# 04: Flick

**What to build:** During a Catch, a quick swipe across the moving Monster is a Flick. It flings the Monster into a wall and counts as two Bonks.

**Blocked by:** 03 (First Catch).

**Status:** ready-for-agent

- [ ] Rendering layer tells a tap from a quick swipe and sends Flick events with the swipe path; the thresholds live in this layer
- [ ] Core: a Flick whose path crosses the moving Monster adds two steps of Dizzy and sends it flying in the swipe direction until it hits a wall
- [ ] Core: a Flick while Stunned adds no Dizzy (same rule as a Bonk); a Flick that misses does nothing
- [ ] Core tests for "a Flick adds two steps", "a Flick that misses does nothing" and "a Flick while Stunned adds nothing"
- [ ] The wall hit has a visible bump (squash against the wall)
- [ ] Playtested in Chrome's device toolbar: taps aren't mistaken for Flicks and vice versa
