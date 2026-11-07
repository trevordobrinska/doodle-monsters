# 11: Name Card, Bio and Say Goodbye

**What to build:** Tapping a Monster in the Zoo opens its Name Card: its name, a large picture, the date it was drawn, its Temperament and a short, silly Bio. The Bio is generated offline from real facts about the Monster (number of Googly Eyes, main color, Temperament). The Name Card has a Say Goodbye button that needs a press and hold. Then the Monster waves and walks away, and that's the only way a Monster ever leaves the Zoo.

**Blocked by:** 09 (Zoo).

**Status:** ready-for-agent

- [ ] Tapping a Zoo Monster opens its Name Card; it can be closed back to the Habitat
- [ ] The Name Card shows name, large picture, date drawn, Temperament and Bio
- [ ] The Bio generator fills in blanks from kid-safe word lists kept as data, using eye count, main color and Temperament; the Bio is created once when caught and saved with the Monster; works offline
- [ ] Say Goodbye needs a press and hold to confirm; letting go early cancels
- [ ] After Say Goodbye the Monster waves and walks out of the Habitat and is removed from storage
- [ ] Core tests: "the Bio mentions the eye count, main color and Temperament", "the same dice gives the same Bio", "Say Goodbye removes the Monster from the Zoo"
