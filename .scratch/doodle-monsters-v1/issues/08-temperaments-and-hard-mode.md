# 08: Temperaments and hard mode

**What to build:** The Temperament a kid picks changes how their Monster behaves during its Catch, so different Monsters feel different. A hard mode toggle tightens everything for the 10-year-old, while normal mode stays catchable in about 30–60 s for the 7-year-old.

**Blocked by:** 07 (Bring it to life).

**Status:** ready-for-agent

- [ ] Each Temperament is a set of numbers in the core (e.g. base speed, dash boost, Stunned length, Dizzy drain rate, wandering style)
- [ ] Hard mode applies one tightening to every Temperament
- [ ] A hard mode toggle a kid can find and flip; the choice is remembered
- [ ] Core tests compare behavior, not exact numbers: e.g. "a Speedy Monster moves faster than a Sleepy one", "Dizzy drains faster in hard mode"
- [ ] The sleepy slowdown after about 2 minutes still works for every Temperament and in hard mode (a Catch can't fail)
- [ ] Each Temperament is playtested in Chrome's device toolbar to feel distinct
