# 01: Sturdy becomes Shy

**What to build:** Kids see the Sturdy Temperament as 🙈 **Shy** everywhere: the Temperament picker, Name Cards and Bios. Kids may not know the word "sturdy." Monsters already saved as Sturdy show up as Shy without any change to their saved data.

**Blocked by:** none.

**Status:** done

- [x] The picker shows "🙈 Shy" in place of "🪨 Sturdy"
- [x] The stored Temperament value stays `sturdy`, so Monsters already in a Zoo or Napping load unchanged and show as Shy
- [x] The Bio lines for this Temperament are rewritten to be about being shy. Right now they're about being sturdy (`src/core/bioWords.ts`). They stay kid-safe and silly.
- [x] Its Catch behavior stays the same for now: slow, and quick to shake off Stunned and Dizzy. The Shell Trick comes in ticket 04.
- [x] Tests that check the Bio or the Temperament word say Shy

## Comments
