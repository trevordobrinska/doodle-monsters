# 03: First Catch with the placeholder Monster

**What to build:** A kid can Catch the placeholder blob from start to finish. Tapping it while it moves is a Bonk: it squashes with stars and gets more Dizzy. Then it's Stunned for about a second (extra taps just "boing" with no penalty), then dashes off faster in a random direction. Dizzy drains if the kid goes a few seconds without a Bonk. When fully Dizzy it gets spiral eyes, and one more tap catches it in a bubble. A Catch can't fail: after about 2 minutes the Monster gets sleepy and slows down. Use glossary terms throughout.

**Blocked by:** 01 (Walking skeleton).

**Status:** ready-for-agent

- [ ] Core: a tap that hits the moving Monster is a Bonk and adds one step of Dizzy; a miss does nothing
- [ ] Core: after a Bonk the Monster is Stunned for about 1 s, and taps during that window don't add Dizzy
- [ ] Core: when Stunned ends, the Monster dashes faster in a random direction (from the injected dice)
- [ ] Core: Dizzy drains after a few seconds without a Bonk
- [ ] Core: at full Dizzy the Monster is ready to be caught, and one more tap catches it
- [ ] Core: after about 2 minutes the Monster gets sleepy and moves slower
- [ ] Each rule above has a test through the core's interface (events + `tick(dt)`), with no rendering in tests
- [ ] Renderer: squash and stretch with stars on a Bonk, wobble while Stunned, a visible Dizzy meter, spiral eyes at full Dizzy, the bubble on catch
- [ ] Rendering layer turns pointer events into Bonk events; hit-testing is done by the core
- [ ] A normal Catch takes roughly 30–60 s when playtested in Chrome's device toolbar (tuning numbers are starting points)
