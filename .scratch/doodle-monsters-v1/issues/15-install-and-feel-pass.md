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

**2026-11-08 (from Catch Tricks ticket 05):** Bouncy's Dodge doesn't fix the "lurch". The Dodge is a rare, separate sideways hop (with a real lift off the ground) only after the first 2 Bonks; Bouncy's everyday wandering is unchanged. The lurch comes from the core's speed rising and falling (`hopping()` in `gameCore.ts`, a 0.5 s cycle) while the renderer draws every Monster's little bounce on its own timer (`hopPhase` in `renderer.ts`), so the two aren't in step. A likely fix: have the renderer's bounce follow Bouncy's speed cycle, so it's in the air when it speeds up and lands when it slows. Still judge it on the tablet first.

**2026-11-08 (from the landscape spec, `.scratch/landscape/`):** The "web app manifest with … fullscreen landscape display" item is overtaken by events. Kids profiles can't install anything (Night 1), so the game is reached through the Arcade as an allowed website, and a manifest orientation does nothing there. Landscape is handled by drawing the game sideways when the tablet is upright, with no fullscreen or orientation lock (ADR 0002). Drop that checkbox; the "installed on both tablets" item is likewise replaced by "opens from the Arcade on both tablets" (Arcade ticket 05).
