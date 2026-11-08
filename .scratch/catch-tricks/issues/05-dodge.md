# 05: Bouncy's Dodge

**What to build:** A Bouncy Monster's Trick. Sometimes, just as a finger lands on it, it hops sideways out of the way. That tap goes "boing" and adds no Dizzy. It uses the shared ramp, hard mode and sleepy stop from ticket 02, so it dodges more often as it gets more Dizzy.

**Blocked by:** 02 (Tricks ramp up during a Catch).

**Status:** ready-for-agent

- [ ] A tap that would have landed sometimes becomes a Dodge: the Monster hops a short way sideways, and the tap goes "boing," with no Dizzy and no penalty
- [ ] It never dodges twice in a row, so the tap after a Dodge can always land
- [ ] The hop is quick but easy to see, so the kid can tell it was a Dodge and not a miss
- [ ] Flicks are never dodged
- [ ] A fully Dizzy Monster doesn't dodge, so the final catching tap always works
- [ ] Core tests: "a dodging Bouncy Monster turns a tap into a boing," "a Bouncy Monster never dodges twice in a row"
- [ ] V1 ticket 08 found that Bouncy's hops feel like a "lurch," not a bounce. Check whether the Dodge fixes that. If it doesn't, leave a note on V1 ticket 15.

## Comments
