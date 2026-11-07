# 05: Sound

**What to build:** The Catch has fun sound effects: Bonk, "boing" on a Stunned tap, Flick/wall hit and the bubble catch. Each Monster's sounds are pitched a little differently so it has its own voice. No music.

**Blocked by:** 03 (First Catch).

**Status:** ready-for-agent

- [ ] Uses Kenney.nl CC0 sound effects bundled with the site (credit noted in the repo even though it's CC0)
- [ ] Sounds play on Bonk, Stunned tap, wall hit and catch
- [ ] Each Monster gets a pitch shift chosen once (from the dice) and reused for all its sounds
- [ ] Audio starts only after the first touch, so the browser doesn't block it
- [ ] Sound logic stays out of the game core; the core only reports what happened
