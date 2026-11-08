# 03: Sleepy's Doze

**What to build:** A Sleepy Monster's Trick. It stops and dozes for a bit, shown with 💤 or closed eyes. The kid's first tap only wakes it with a yawn and adds no Dizzy. Then it runs off, and the next tap that lands counts as a Bonk. This is the gentlest Trick, because a dozing Monster is easy to find. It uses the shared ramp, hard mode and sleepy stop from ticket 02.

**Blocked by:** 02 (Tricks ramp up during a Catch).

**Status:** ready-for-agent

- [ ] A dozing Monster stands still
- [ ] A tap on a dozing Monster wakes it: no Dizzy, no penalty, and a "boing" or yawn sound (reusing an existing sound is fine). Then it dashes off.
- [ ] A Flick on a dozing Monster also only wakes it, so the first hit always just wakes it
- [ ] If nobody wakes it, it wakes on its own after a few seconds and carries on
- [ ] A fully Dizzy Monster doesn't Doze, so the final catching tap always works
- [ ] Core tests: "a tap on a dozing Monster wakes it without adding Dizzy," "the tap after waking it is a Bonk," "a dozing Monster wakes on its own"

## Comments
