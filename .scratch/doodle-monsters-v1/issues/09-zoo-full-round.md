# 09: Zoo: the full Round

**What to build:** The whole Round loops. The app opens straight into the kid's Zoo Habitat with a big "Draw a Monster!" button, and an arrow pointing at it when the Zoo is empty. After a Catch, the caught Monster moves into the Habitat, where Monsters wander and bounce and their Googly Eyes follow the kid's finger. The Zoo is saved on the device and is still there after a reload. Draw once, catch once: a caught Monster can't be caught again.

**Blocked by:** 07 (Bring it to life).

**Status:** ready-for-agent

- [ ] The app opens to the Zoo Habitat with a big "Draw a Monster!" button that starts a Round
- [ ] An empty Zoo shows an arrow pointing at the button
- [ ] A caught Monster moves into the Habitat, wandering and bouncing
- [ ] Googly Eyes follow the kid's finger while they touch the screen
- [ ] All saving goes through the Zoo storage interface (save, list, remove, export, import); a provisional IndexedDB version is used in the app and an in-memory version in tests
- [ ] The Monster record is sync-ready plain data: stable unique id, name, trimmed image, Googly Eye positions, Temperament, Bio placeholder, main color, date drawn, status, schema version
- [ ] Core tests: "a caught Monster appears in the Zoo", "it's still there after reloading from storage", "a caught Monster can't be caught again"
- [ ] Smooth with about 10 Monsters in the Habitat under Chrome CPU throttling
