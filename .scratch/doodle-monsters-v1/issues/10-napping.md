# 10: Napping

**What to build:** If a kid leaves in the middle of a Catch (the app is hidden, closed or navigated away from), the Monster is saved as Napping. It waits in the Zoo with a 💤, and tapping it resumes the Catch. Nothing the kid made is lost.

**Blocked by:** 09 (Zoo).

**Status:** done

- [x] Leaving mid-Catch saves the Monster as Napping (drawing, Googly Eyes, Temperament and name kept)
- [x] A Napping Monster shows in the Zoo with a 💤
- [x] Tapping a Napping Monster resumes its Catch (Dizzy can start fresh)
- [x] Catching a resumed Monster makes it a normal Zoo Monster
- [x] Core tests: "leaving a Catch leaves the Monster Napping in the Zoo", "resuming returns to the Catch", "Napping survives reloading from storage"

## Comments

**2026-11-07 (agent):** Code done. Core tests are in `src/core/napping.test.ts`. Choices made along the way:
- **Saved the moment the Catch begins.** `startCatch()` saves the Monster with status `"napping"`. When it's caught, the core saves it again with the same id as `"zoo"`. So a Monster is never lost, even if the tablet kills the app without firing any event. A Monster that's caught is saved twice, which is harmless.
- **Leaving:** the new `leave()` works only mid-Catch: the Catch has begun and the Monster isn't caught yet. The app calls it on `visibilitychange` (hidden) and on `pagehide`. Coming back shows the Zoo, with the Monster Napping where it was when the kid left. Leaving while drawing or bringing to life still loses the drawing, since the spec scopes Napping to "mid-Catch". If we want those kept too, that's a new ticket.
- **Resuming:** `zooMonsterAt(point)` hit-tests the Zoo in the core (the Monster in front wins), and `resume(id)` starts the Catch again. Name, drawing, Googly Eyes and Temperament are kept. Dizzy, the sleepy timer and the starting position begin fresh. Its voice is picked again, because voice isn't in the record (as noted on ticket 09).
- **In the Habitat:** a Napping Monster stays where it is. It breathes slowly, its eyelids droop, its eyes don't follow the finger, and a white 💤 bubble bobs by its top corner. `ZooMonsterView` has a new `napping` field. `loadZoo()` now loads Napping Monsters too.

The agent checked it in headless Edge over DevTools. It started a Catch and hid the page, and the Monster showed Napping with its 💤. Tapping it resumed the Catch with fresh Dizzy. Navigating away mid-Catch and coming back left it Napping in the Zoo and in IndexedDB.

Known issues:
- A Monster that was Napping in the bottom-right corner sat partly under the "Draw a Monster!" button, where it was hard to see and tap. Napping Monsters don't move, so it stays hidden. Worth judging in the playtest.
- Unrelated, from ticket 08: the Bring-to-life screen threw `IndexSizeError: The radius provided (-1.38) is negative` once from `drawGooglyEye`, probably on the first frame of an eye popping in.

It still needs a human playtest in Chrome's device toolbar. Check:
- the 💤 Monster reads as "asleep, tap me" to the 7-year-old;
- switching tabs mid-Catch and coming back to the Zoo (not the Catch) feels right.

**2026-11-07 (human):** Playtested in the browser. Works great.
