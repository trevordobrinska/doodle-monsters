# 04: Fullscreen probe

**What to find out:** Inside the Amazon Kids web wrapper on a Fire HD 8, can a page go fullscreen and hide the Kids top bar? How does a kid get back out? Can it lock landscape once fullscreen? If fullscreen works, the game could fill the whole 16:10 screen with no blank bars, and a semi-transparent home button could take its place as the way back to the Arcade. If it doesn't, the fallback is to paint the bars with Habitat scenery. ADR 0002 currently rules fullscreen out because nobody knows whether Silk-in-Kids supports it, and because the top bar is how kids leave.

**Blocked by:** None.

**Status:** ready-for-human

**The probe:** a throwaway page at `public/fullscreen-probe/index.html`. Once pushed it lives at https://trevordobrinska.github.io/doodle-monsters/fullscreen-probe/. It's a plain static file with no build step and no game code. Delete the folder once this ticket is answered.

**How to reach it on the tablet:** add the URL in the Parent Dashboard so it shows up in My Stuff (same as Night 1), or open it in the adult profile's Silk for a first look. If it does show up in My Stuff, it opens in the same Kids wrapper (top bar showing) that the Arcade does.

## Checks (in a Kids profile, on one tablet)

- [ ] Opened: write down the "Now" card's page size, screen size and "Top bar eats" line, held landscape and held upright (this measures the Kids top bar)
- [ ] Button 1 (Go fullscreen): does the Kids top bar go away? Does the pink edge reach the screen edges? What does the log say?
- [ ] Getting out of fullscreen: try the back gesture or button, a swipe from the top or side, and the ⌂ corner button. Which ones work? Does the top bar come back?
- [ ] The ⌂ button and "Back to Arcade": do they reach the Arcade, and does the Arcade show normally (not fullscreen)?
- [ ] "Open the game" then back to the probe: is the probe back to not fullscreen? (Expected: yes, since fullscreen ends whenever you go to another page)
- [ ] Button 2 (Fullscreen + lock landscape): held upright, does the screen turn to landscape and stay there? Log line?
- [ ] Button 3 (Lock without fullscreen): expected to be refused. Log line?
- [ ] Anything surprising (a Kids warning or prompt, the wrapper closing, the page reloading)

## Comments
