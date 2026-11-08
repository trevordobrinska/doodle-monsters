# 02: Tricks ramp up during a Catch, starting with Sneaky's Fade

**What to build:** The first Trick, plus the rules every Trick shares. A Sneaky Monster now and then goes almost invisible for about a second during its Catch. It can still be Bonked if the kid keeps track of it. It doesn't Fade at first, then Fades more and more often as it gets more Dizzy. In hard mode it Fades sooner and more often. Once it's sleepy, it stops Fading. See `.scratch/catch-tricks/spec.md` and **Trick** in `GLOSSARY.md`.

**Blocked by:** none.

**Status:** ready-for-agent

- [ ] **Ramp (shared by every Trick):** no Tricks before the first 2 Bonks (a Flick counts as 2). After that, the more Dizzy the Monster is, the more often it plays its Trick. It plays it most often around the final catching tap.
- [ ] **Hard mode:** Tricks start sooner and happen more often, as part of hard mode's one tightening. The Tricks themselves stay the same.
- [ ] **Sleepy stop:** once a Monster gets sleepy (after about 2 minutes), it plays no more Tricks, so a Catch still can't fail.
- [ ] **Never punishes:** a Trick never takes Dizzy away.
- [ ] **Fade:** a Sneaky Monster goes almost (not fully) invisible for about a second, then comes back. Bonks and Flicks work as normal while it's faded.
- [ ] The core reports when a Monster is playing its Trick, so the renderer can draw it. The Googly Eyes fade along with the drawing.
- [ ] Core tests, in glossary terms, for example:
  - "a Monster plays no Trick before its first 2 Bonks"
  - "a nearly Dizzy Monster plays its Trick more often than one just past 2 Bonks"
  - "a sleepy Monster plays no Trick"
  - "hard mode plays Tricks more often"
  - "a faded Sneaky Monster can still be Bonked"

  Compare behavior, not exact numbers.
- [ ] Monsters with other Temperaments play no Trick yet
- [ ] The Temperament picker doesn't describe the Trick. Kids discover Tricks on their own.

## Comments
