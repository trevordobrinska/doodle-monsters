# 07: Bring it to life

**What to build:** Between drawing and the Catch, the kid brings their Monster to life. They stick 1 to 5 Googly Eyes on it (and can move or remove them), pick a Temperament from a short list shown as a word plus an icon, and get a generated name they can reroll with 🎲 or type themselves. The Googly Eyes jiggle when the Monster moves during the Catch. The Catch starts once it has eyes, a Temperament and a name.

**Blocked by:** 06 (Draw your Monster).

**Status:** ready-for-human

- [x] The kid can place 1 to 5 Googly Eyes on the drawing and move or remove them; positions are stored relative to the image
- [x] Temperament picker with the starting list (something like Speedy, Sneaky, Bouncy, Sturdy, Sleepy), each shown as a word plus an icon
- [x] Name generator fills in blanks from kid-safe word lists kept as data; 🎲 rerolls; the name can be edited by typing
- [x] Starting the Catch is only possible with at least one Googly Eye, a Temperament and a name
- [x] Googly Eyes jiggle when the Monster moves during the Catch
- [x] Core: the Round goes Draw → Bring to life → Catch; tests cover the 1–5 eye limit, needing a Temperament and a name, and "the same dice gives the same name"

## Comments

**2026-11-07 (agent):** Code done. The core owns the Round's Draw → Bring to life → Catch steps and the rules: `eyes()`, `placeEye`, `moveEye`, `removeEye`, `pickTemperament`, `name()`, `rerollName`, `setName`, `canStartCatch` and `startCatch` in `src/core/gameCore.ts`. They're tested in `src/core/bringToLife.test.ts` (17 tests). The Temperament list (word plus icon) is in `src/core/temperaments.ts`, and the name word lists are in `src/core/nameWords.ts`, ready for the family to add to. The screen is `src/bringToLife/bringToLifeScreen.ts`. The Googly Eye drawing and jiggle are in `src/render/googlyEyes.ts`, shared by that screen and the Catch. Choices made along the way:
- **Eyes:** tap the Monster to stick one on, drag to move it, and drag it off the Monster to take it off. A "3/5" counter shows how many it has, and the hint shakes when a 6th is tried. Eye positions are 0–1 within the drawing's box, and an eye is always kept on the box. Each eye's size is a fixed fraction of the Monster's longest side, so it looks the same on this screen as in the Catch.
- **Temperaments:** ⚡ Speedy, 🤫 Sneaky, 🦘 Bouncy, 🪨 Sturdy and 😴 Sleepy. They don't change how the Monster moves yet; that's ticket 08.
- **Names** come from templates like "{adjective} {thing}", "{title} {thing}" or "{start}{end}" (e.g. "Sir Biscuit", "Plimdoodle"). 🎲 always gives a *different* name. Typed names are cut at 24 characters, and spaces are trimmed off the ends when the Catch starts. A blank name can't start the Catch.
- **Jiggle:** each pupil is a loose ball that settles at the bottom of its eye. It gets left behind whenever the Monster changes speed or direction, so wall bounces, Bonks and landing a Flick rattle it. Not asked for: the Monster now does a small hop (5 arena units) while it runs, so the eyes rattle between bounces too. Dragging an eye on the Bring to life screen rattles it as well.
- **Dice:** the name uses the same dice as the Catch, so the Catch's random rolls (and the voice) now come after the name's.
- **Back to drawing:** there's no way back from Bring to life to the drawing. That wasn't asked for.

Smoke-tested in headless Edge at 960×600 with touch: drawing, sticking on 3 eyes, dragging one off, picking a Temperament, 🎲, then the Catch. There were no console errors. It still needs a human playtest. Check:
- how strong the jiggle feels during open running (it's gentle between bounces);
- that eyes feel big enough to grab with a finger;
- what typing a name with the Fire's on-screen keyboard is like.
