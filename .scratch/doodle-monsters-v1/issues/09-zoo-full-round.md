# 09: Zoo: the full Round

**What to build:** The whole Round loops. The app opens straight into the kid's Zoo Habitat with a big "Draw a Monster!" button, and an arrow pointing at it when the Zoo is empty. After a Catch, the caught Monster moves into the Habitat, where Monsters wander and bounce and their Googly Eyes follow the kid's finger. The Zoo is saved on the device and is still there after a reload. Draw once, catch once: a caught Monster can't be caught again.

**Blocked by:** 07 (Bring it to life).

**Status:** ready-for-human

- [x] The app opens to the Zoo Habitat with a big "Draw a Monster!" button that starts a Round
- [x] An empty Zoo shows an arrow pointing at the button
- [x] A caught Monster moves into the Habitat, wandering and bouncing
- [x] Googly Eyes follow the kid's finger while they touch the screen
- [x] All saving goes through the Zoo storage interface (save, list, remove, export, import); a provisional IndexedDB version is used in the app and an in-memory version in tests
- [x] The Monster record is sync-ready plain data: stable unique id, name, trimmed image, Googly Eye positions, Temperament, Bio placeholder, main color, date drawn, status, schema version
- [x] Core tests: "a caught Monster appears in the Zoo", "it's still there after reloading from storage", "a caught Monster can't be caught again"
- [x] Smooth with about 10 Monsters in the Habitat under Chrome CPU throttling

## Comments

**2026-11-07 (agent):** Code done. The core now runs the whole loop: it opens in a `zoo` phase, `startRound()` ("Draw a Monster!") starts a Round, and `goToZoo()` returns once the Monster is caught. One core lasts for the whole app session; each Round's Monster lives in an inner `createRound` in `src/core/gameCore.ts`. When a Monster is caught, the core builds its record, puts it in the Habitat where it was caught, and saves it. `zoo()` lists the Zoo's Monsters, `tick` makes them wander in the `zoo` phase, `loadZoo()` brings the saved Zoo back, and `saved()` settles once saving has finished. Tests are in `src/core/zoo.test.ts`, plus new Round tests in `round.test.ts`. Choices made along the way:
- **Storage interface** is in `src/core/zooStorage.ts`: `save`, `list`, `remove`, `exportZoo`, `importZoo`, plus `inMemoryZooStorage()` for tests. `importZoo` adds to the Zoo and never takes anything away, so a Restore can't lose a Monster. The provisional IndexedDB version is `src/storage/indexedDbZooStorage.ts`: a `doodle-monsters` database with a `monsters` store keyed by id. It doesn't ask for persistent storage yet (ticket 14).
- **Record:** `schemaVersion` (1), `id` (32 hex digits from the dice), `name`, `image` (a PNG Blob), `drawingSize` (the trimmed drawing's width and height, which the ticket didn't list; it's how a reloaded Monster keeps its shape), `eyes` (x, y relative to the drawing), `temperament`, `bio` (empty for now; ticket 11), `mainColor`, `drawnAt` (an ISO date from when the drawing was finished) and `status` (`"zoo"`; `"napping"` is ready for ticket 10).
- **Clock** now means wall-clock milliseconds (`Date.now()`), so it can date Monsters. `finishDrawing` now takes the drawing as a Blob too.
- **After a Catch**, the bubble shows, then the Monster moves into the Zoo on its own after 3.5 s. A tap after 1.5 s goes there sooner.
- **Habitat:** Monsters stroll at 30% of their Catch speed, turn every 2–5 s and bounce off the edges. The renderer (`src/render/habitatRenderer.ts`) hops and squashes them, gives them shadows, and pops them in. While a finger is down, Googly Eyes roll round to look at it and still jiggle (`lookAt` in `googlyEyes.ts`). Monsters loaded on reload start at random spots. Still a single Habitat; splitting is ticket 12. Tapping a Zoo Monster does nothing yet (Name Card, ticket 11).
- **Voice** isn't saved, so a reloaded Monster's voice isn't kept. It only matters once Zoo Monsters make sounds.

The agent checked it in headless Edge over DevTools with emulated touch: two full Rounds, the Zoo kept after a reload, the arrow showing only when the Zoo is empty, and 10 Monsters at 60 fps (worst frame 16.8 ms) under 4× CPU throttling. Known gap, left for ticket 14: if a save fails, the Monster still shows in the Habitat but is gone after a reload. The only sign is a console error; nothing retries and nothing tells the kid.

It still needs a human playtest in Chrome's device toolbar. Check:
- the arrow and "Draw a Monster!" button are obvious to the 7-year-old;
- 3.5 s in the bubble before the Zoo feels right;
- eyes following the finger reads as "watching me".
