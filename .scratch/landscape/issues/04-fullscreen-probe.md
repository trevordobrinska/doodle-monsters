# 04: Fullscreen probe

**What to find out:** Inside the Amazon Kids web wrapper on a Fire HD 8, can a page go fullscreen and hide the Kids top bar? How does a kid get back out? Can it lock landscape once fullscreen? If fullscreen works, the game could fill the whole 16:10 screen with no blank bars, and a semi-transparent home button could take its place as the way back to the Arcade. If it doesn't, the fallback is to paint the bars with Habitat scenery. ADR 0002 currently rules fullscreen out because nobody knows whether Silk-in-Kids supports it, and because the top bar is how kids leave.

**Blocked by:** None.

**Status:** resolved

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

**2026-11-08 (builder, recorded by agent), first readings.** Opened in the Kids profile's **web browser**, not from My Stuff: the probe doesn't get its own My Stuff icon, probably because it sits under the already-approved Arcade site.

- **Before fullscreen:**
  - Landscape: page 961×396, screen 962×601 (avail the same). The browser's bars take 205px off the short side. DPR 1.33125, orientation `landscape-secondary`, 270°.
  - Upright: page 601×756, screen 601×962. The bars take 206px off the long side. Orientation `portrait-primary`, 0°.
  - Treat these numbers as the browser's bars, not the My Stuff launch's top bar, which is likely smaller.
- **Go fullscreen works.** The log shows "request resolved", then `resize → 601 × 961`, then fullscreenchange to FULLSCREEN. The Kids top bar goes away completely and the pink edge reaches all four screen edges. Fullscreen page: 961×601 landscape, 601×961 upright, which is almost exactly 16:10, so a 1280×800 game would fill it with no bars.
- **The ⌂ button while fullscreen** goes to the Arcade, which looks normal with its top bar back.
- **Opening the game from the fullscreen probe:** the game is not fullscreen when it opens (fullscreen ends on navigation, as expected). The builder described it as "with the top off"; still to confirm whether that means the top bar showed.
- **Still to do:** checks 8 (ways out of fullscreen), 10, 11 (fullscreen + landscape lock), 12 (lock without fullscreen), 13 (anything odd), and the same checks launched via the Arcade from My Stuff.

**2026-11-08 (builder, recorded by agent), second readings.** Still in the Kids profile's web browser.

- **Correction:** the bar that fullscreen hid is the Kids **web browser's** top bar, the one with the URL box. It isn't the Kids top bar that shows when the Arcade opens from My Stuff. Whether fullscreen also hides that one is still untested.
- **Getting out:** the system back button exits fullscreen, and the browser bar comes back. So a kid always has a way out, even without the ⌂ button.
- **Landscape lock:** both button 2 (fullscreen + lock) and button 3 (lock alone) log "Screen orientation lock is not available on this device." So there is no landscape lock, even when fullscreen, and the sideways turn from ticket 02 stays.
- **Still untested:** fullscreen when the page is opened through the Arcade from My Stuff, the way the game is really reached.

**2026-11-08 (agent), resolved.** Answered well enough to act on: fullscreen works on a tap, Back leaves it, and there's no landscape lock. The follow-up is `.scratch/fullscreen/spec.md` (fullscreen on the first tap), and ADR 0002 now says so. The probe page `public/fullscreen-probe/` is deleted (fullscreen ticket 01). The one open question, whether fullscreen also works when the game is opened through the Arcade from My Stuff, moves to `.scratch/fullscreen/issues/02-tablet-check.md`.
