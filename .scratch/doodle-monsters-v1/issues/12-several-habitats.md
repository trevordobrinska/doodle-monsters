# 12: Several Habitats

**What to build:** When a kid's Zoo grows past about 10 Monsters, it's split across several Habitats the kid can move between, so the screen never gets too crowded and the game stays smooth.

**Blocked by:** 09 (Zoo).

**Status:** done

- [x] The core splits the Zoo into Habitats of about 10 Monsters max
- [x] The kid can move between Habitats with big, obvious controls (swipe or arrows)
- [x] A newly caught Monster goes into a Habitat with room, and the kid sees it arrive
- [x] Saying Goodbye or catching doesn't shuffle Monsters around unexpectedly
- [x] Core tests: "a Zoo with more than about 10 Monsters is split into several Habitats", "every Monster is in exactly one Habitat"

## Comments

**2026-11-07 (agent):** Code done. Core tests are in `src/core/habitats.test.ts`. Choices made along the way:
- **Splitting:** a Habitat holds 10 Monsters at most, Napping ones included. The core gained `habitatCount()`, `shownHabitat()`, `monstersShown()` and `showHabitat(i)`, and each `ZooMonsterView` says which `habitat` it's in. Taps (`zooMonsterAt`) only land on Monsters in the Habitat shown.
- **Where a new Monster goes:** into the Habitat on screen if it has room, else the first Habitat with room, else a new one. The Zoo then shows that Habitat, so the kid sees it pop in. A Monster left mid-Catch goes Napping the same way. Nobody else ever moves.
- **Kept across reloads:** each Monster's Habitat is now saved in its record (`habitat`, optional), so a Goodbye doesn't make others shuffle up the next time the app opens. This is a new field on the spec's Monster record, so `MONSTER_SCHEMA_VERSION` is now 2. Monsters saved before (version 1) are placed oldest first and saved with their Habitat on the next load. A Habitat emptied by Goodbyes stays until the app is opened again; after that it's only kept if a later Habitat still has Monsters.
- **Opening the app:** it opens on the Habitat with a Napping Monster, if there is one, so the 💤 isn't hidden away; otherwise on the first.
- **Moving between Habitats:** big round ◀ ▶ buttons (96 px) at the screen's sides, hidden at the ends, and a quick sideways swipe (left = next). A row of dots at the top shows which Habitat you're on. Each Habitat has its own ground (meadow, sand, frost, lilac, peach, in turn), and the next one slides in over the last.

The agent checked it in headless Edge over DevTools with 23 seeded Monsters (one Napping). It opened on Habitat 2 of 3, where the Napping one was. ◀ and both swipe directions moved between Habitats, and the arrows hid at the ends.

Known issues:
- During the 0.35 s slide, Monsters are drawn a little off from where taps land.
- A slow sideways drag doesn't count as a swipe (a swipe needs the Flick's speed); the arrows are there for that.
- Still from ticket 10: a Monster under the "Draw a Monster!" button can't be tapped.

It still needs a human playtest in Chrome's device toolbar. Check:
- the arrows and dots are easy to see and use, and don't get in the way of the Monsters;
- the swipe feels natural and doesn't fire when you meant to tap a Monster;
- a newly caught Monster arriving in a fresh Habitat is clear to the kid.

**2026-11-07 (human):** Playtested in the browser (with `?placeholders=10`). Everything worked as expected.
