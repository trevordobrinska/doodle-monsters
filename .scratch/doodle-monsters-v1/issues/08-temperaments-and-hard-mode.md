# 08: Temperaments and hard mode

**What to build:** The Temperament a kid picks changes how their Monster behaves during its Catch, so different Monsters feel different. A hard mode toggle tightens everything for the 10-year-old, while normal mode stays catchable in about 30–60 s for the 7-year-old.

**Blocked by:** 07 (Bring it to life).

**Status:** done

- [x] Each Temperament is a set of numbers in the core (e.g. base speed, dash boost, Stunned length, Dizzy drain rate, wandering style)
- [x] Hard mode applies one tightening to every Temperament
- [x] A hard mode toggle a kid can find and flip; the choice is remembered
- [x] Core tests compare behavior, not exact numbers: e.g. "a Speedy Monster moves faster than a Sleepy one", "Dizzy drains faster in hard mode"
- [x] The sleepy slowdown after about 2 minutes still works for every Temperament and in hard mode (a Catch can't fail)
- [x] Each Temperament is playtested in Chrome's device toolbar to feel distinct

## Comments

**2026-11-07 (agent):** Code done. Each Temperament is a `Behavior` (speed, dash boost, Stunned length, how often Dizzy drains a step, and a wandering style) in `BEHAVIORS` in `src/core/temperaments.ts`. Hard mode is one `tighten()` applied to every Temperament alike (×1.3 speed, ×1.4 dash boost, ×0.75 Stunned, ×0.65 drain step). The core takes `setHardMode(on)` and reports `hardMode()`. Tests are in `src/core/temperaments.test.ts`; they compare behavior (e.g. "a Speedy Monster moves faster than a Sleepy one", "hard mode makes a sturdy Monster's Dizzy drain faster"), never exact numbers. Choices made along the way:
- **The five Temperaments:** ⚡ Speedy is fast, with a big dash. 🤫 Sneaky turns off in a new direction every ~1.2 s on its own. 🦘 Bouncy hops, with its speed rising and falling each half second. 🪨 Sturdy moves slowly but shakes off Stunned and Dizzy quickly. 😴 Sleepy is the slowest, with a long Stunned and slow drain. Normal Speedy is a bit quicker than the old single Monster (380 vs 320 px/s); Sneaky and Bouncy match it.
- **Wandering style** isn't tightened by hard mode, so each Temperament still feels like itself.
- **Toggle:** a "💪 Hard mode: off/ON" button on the Bring to life panel, under the Temperaments. It's remembered on the tablet in `localStorage` (a setting, not Zoo data), so it stays on for later Rounds until flipped back. Once the Zoo exists (ticket 09) it may want to move there. The core doesn't stop hard mode changing mid-Catch; only the UI does (there's no toggle during the Catch).
- **Not asked for, but needed for "a Catch can't fail":** once a Monster is sleepy (after ~2 min), its Dizzy stops draining. Before, a kid tapping slower than the drain (e.g. once every 5 s) could never finish, in any mode. The `Dizzy` glossary entry ("it fades…") doesn't mention this exception yet.
- **Existing test loosened:** the wall-bounce test in `gameCore.test.ts` now counts "reached a wall" as within 10 px (one frame's travel), since faster Monsters can bounce between frames.
- The console now logs `Caught <temperament> (normal|hard) in N s` to help tuning.

Not playtested in a browser by the agent. It still needs a human playtest in Chrome's device toolbar. Check:
- each Temperament feels distinct (especially Sneaky's zigzag and Bouncy's hops);
- normal mode takes the 7-year-old about 30–60 s for every Temperament, Speedy and Sturdy most of all;
- hard mode is a challenge for the 10-year-old but still catchable;
- the hard mode button is easy to find and not easy to hit by accident.

**2026-11-07 (human):** Tested in the browser. It's hard to judge the Temperaments with a mouse (and as an adult, not a 7-year-old). One note: Bouncy doesn't really feel like it's bouncing; it's more of a "lurch". Not fixing it yet: judge it on the tablet first (ticket 15).
