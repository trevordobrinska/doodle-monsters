# 06: Speedy's After-image

**What to build:** A Speedy Monster's Trick. While it dashes off after a Bonk, it leaves a fake copy of itself behind for a moment. The fake looks just like it, Googly Eyes and all. Tapping the fake goes "boing" and pops it. It uses the shared ramp, hard mode and sleepy stop from ticket 02.

**Blocked by:** 02 (Tricks ramp up during a Catch).

**Status:** ready-for-agent

- [ ] Sometimes, as a Speedy Monster dashes off, a fake copy appears where it was. The fake stays still for about a second, then fades away.
- [ ] A tap on the fake goes "boing," with no Dizzy and no penalty, and pops it
- [ ] A tap where the fake and the real Monster overlap counts as a Bonk on the real one
- [ ] There's only one fake at a time
- [ ] The core reports where the fake is, so the renderer can draw it
- [ ] A fully Dizzy Monster leaves no fakes, so the final catching tap always works
- [ ] Core tests: "a tap on the after-image goes boing," "a tap on the real Monster still Bonks while there's an after-image"

## Comments
