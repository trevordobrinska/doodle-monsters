# 15: Install and on-device feel pass

**What to build:** The game installs on each kid's home screen with its own icon and opens fullscreen, and the Catch and drawing feel right on the real Fire HD 8: smooth, catchable in about 30–60 s in normal mode, still a challenge in hard mode.

**Blocked by:** 04 (Flick), 08 (Temperaments and hard mode), 13 (Run Night 1), and Catch Tricks 01–07 (`.scratch/catch-tricks/issues/`).

**Status:** ready-for-agent

- [ ] Web app manifest with name, icons and fullscreen landscape display (adjusted per the Night 1 results)
- [ ] Installed on both tablets and opens fullscreen from the home screen
- [ ] Tuning numbers (Stunned length, Dizzy drain, dash speed, Flick thresholds, Temperament values, how often Tricks happen, and Bonks needed for full Dizzy) adjusted after playtesting on the device with the kids
- [ ] Drawing and the Habitat with about 10 Monsters stay smooth on the device
- [ ] Any device-only problems found via remote debugging are fixed or written up as new tickets

## Comments

**2026-11-07 (from ticket 08):** When tuning the Temperaments on the tablet, check Bouncy. In the desktop playtest its hops felt like a "lurch" rather than a bounce (its speed just rises and falls; it doesn't leave the ground). Also check that normal mode takes the 7-year-old about 30–60 s for every Temperament, and that the hard mode button isn't easy to hit by accident.
