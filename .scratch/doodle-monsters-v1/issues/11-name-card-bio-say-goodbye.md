# 11: Name Card, Bio and Say Goodbye

**What to build:** Tapping a Monster in the Zoo opens its Name Card: its name, a large picture, the date it was drawn, its Temperament and a short, silly Bio. The Bio is generated offline from real facts about the Monster (number of Googly Eyes, main color, Temperament). The Name Card has a Say Goodbye button that needs a press and hold. Then the Monster waves and walks away, and that's the only way a Monster ever leaves the Zoo.

**Blocked by:** 09 (Zoo).

**Status:** done

- [x] Tapping a Zoo Monster opens its Name Card; it can be closed back to the Habitat
- [x] The Name Card shows name, large picture, date drawn, Temperament and Bio
- [x] The Bio generator fills in blanks from kid-safe word lists kept as data, using eye count, main color and Temperament; the Bio is created once when caught and saved with the Monster; works offline
- [x] Say Goodbye needs a press and hold to confirm; letting go early cancels
- [x] After Say Goodbye the Monster waves and walks out of the Habitat and is removed from storage
- [x] Core tests: "the Bio mentions the eye count, main color and Temperament", "the same dice gives the same Bio", "Say Goodbye removes the Monster from the Zoo"

## Comments

**2026-11-07 (agent):** Code done. Core tests are in `src/core/bioAndGoodbye.test.ts`. Choices made along the way:
- **Bio:** the word lists are data in `src/core/bioWords.ts`: templates, snacks, hobbies, dreams, and a list of habits for each Temperament. Every template uses the eye count ("three googly eyes"), the main color and the Temperament, plus the Monster's name. The core writes the Bio once, at the moment of the catch, with the dice, and saves it with the Monster. A Napping Monster has no Bio until it's caught.
- **Older Monsters:** Zoo Monsters saved before this ticket (from the earlier playtests) have an empty Bio. They get one the next time the Zoo loads, saved so it never changes after that.
- **Name Card:** an HTML overlay (`src/zoo/nameCard.ts`) like Bring to life, not drawn on the canvas. It shows the drawing with its Googly Eyes, the name, "Drawn on <date>" in the tablet's date format, the Temperament's icon and word, and the Bio. ✖ or tapping outside the card closes it. Tapping a Napping Monster still resumes its Catch rather than opening the card.
- **Say Goodbye:** hold for 1.5 s. A pink bar fills the button while it's held, and letting go, cancelling or losing the pointer stops it at once. Then the new `core.sayGoodbye(id)` removes the Monster from storage straight away, so closing the app mid-goodbye still counts. In the Habitat it rocks and waves 👋 for 1.5 s, then hops out the nearer side, past the wall, and is gone. It can't be tapped while leaving, and loading the Zoo again never brings it back. The "Draw your first Monster!" arrow returns when the last Monster leaves.

The agent checked it in headless Edge over DevTools. It seeded a Monster with an empty Bio, which got one on load. Tapping the Monster opened the card. Letting go after 0.7 s kept the card open, and a full hold closed it. The Monster waved, walked off, and was gone from IndexedDB.

Known issues:
- Still from ticket 10: a Monster under the "Draw a Monster!" button can't be tapped, since the tap hits the button. It happened once in testing.

It still needs a human playtest in Chrome's device toolbar. Check:
- the Bios read well and are silly enough (the word lists are meant for the family to grow);
- the hold time feels right: not too long for a 7-year-old, long enough not to happen by accident;
- the wave and walk-off reads as a gentle goodbye.

**2026-11-07 (human):** Playtested in the browser. Adorable; it all looks great.
