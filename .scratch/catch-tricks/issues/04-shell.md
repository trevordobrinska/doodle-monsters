# 04: Shy's Shell

**What to build:** A Shy Monster's Trick. It's still stored as `sturdy` (see ticket 01). Now and then it curls up for a moment. Taps go "boing" while it's curled, but a Flick still knocks it into the wall and counts as normal. Outside those moments, plain Bonks work as normal, so a 7-year-old who can't Flick well still makes progress. It uses the shared ramp, hard mode and sleepy stop from ticket 02.

**Blocked by:** 01 (Sturdy becomes Shy), 02 (Tricks ramp up during a Catch).

**Status:** done

- [x] A curled Monster looks curled up or hiding, for example squashed small with its eyes peeking or shut
- [x] A tap on a curled Monster goes "boing," with no Dizzy and no penalty
- [x] A Flick on a curled Monster flings it into the wall, adds its usual 2 steps of Dizzy and uncurls it
- [x] It stays curled for about a second, and spends most of the Catch uncurled
- [x] A fully Dizzy Monster doesn't curl up, so the final catching tap always works
- [x] Core tests: "a tap on a curled Shy Monster goes boing," "a Flick on a curled Shy Monster still adds two steps"

## Comments
