# 02: Tablet check

**What to build:** The builder opens Doodle Monsters the real way, from the Arcade's My Stuff icon in each kid's Amazon Kids profile, on both Fire HD 8s, and records the results here under `## Comments`. This also covers the open item from the fullscreen probe (landscape ticket 04).

**Blocked by:** 01, and Arcade ticket 02 (`.scratch/arcade/issues/02-house-button.md`).

**Status:** ready-for-human

- [ ] Opened from My Stuff → Arcade → Doodle Monsters, then one tap: the Kids top bar goes away and the game fills the screen with no bars, held landscape. (If it doesn't, write down what happened. The fallback is painting the bars, see the spec's Out of Scope)
- [ ] The first tap still did its job (for example, Draw opened the drawing screen)
- [ ] Held upright while fullscreen: the game is drawn sideways and fills the long side with no bars. Turning the tablet with Auto-rotate on keeps it fullscreen and un-turns it
- [ ] Back leaves fullscreen (the top bar comes back); the next tap goes fullscreen again; a second Back leaves the game
- [ ] The house button goes to the Arcade, and the Arcade looks normal
- [ ] Going fullscreen mid-Catch and mid-drawing loses nothing
- [ ] Anything surprising (a Kids prompt, a reload, the wrapper closing)
