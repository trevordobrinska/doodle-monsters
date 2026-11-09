# Spec: Fullscreen on the first tap

Status: ready-for-agent

Sources: the always-landscape tablet check on 2026-11-08 and the fullscreen probe (`.scratch/landscape/issues/04-fullscreen-probe.md`); ADR 0002; the Arcade's suite rules (`C:\Users\trevo\Projects\arcade\SUITE-RULES.md`) and the house button ticket (`.scratch/arcade/issues/02-house-button.md`).

## Problem Statement

The always-landscape feature works on the tablet: the game opens in landscape and turns correctly. But there are still blank bars. The Fire HD 8's screen and the game's 1280×800 Arena are both 16:10. The Kids top bar takes a strip off one side, which leaves a space of a different shape, so the Arena shrinks to fit:

- Held upright, the bar comes off the long side, leaving slight bars above and below.
- Held landscape, it comes off the short side, leaving larger bars on the left and right.

ADR 0002 ruled fullscreen out for two reasons: nobody knew whether Silk in a Kids profile allows it, and the top bar is how the kids leave. The probe answered the first in the Kids web browser:

- A tap can make the page fullscreen. The bar disappears and the page is 961×601, which is 16:10.
- The system Back button leaves fullscreen.
- Landscape lock is not available on this device, even in fullscreen ("Screen orientation lock is not available on this device").

The Arcade's house button (suite rule 5) answers the second: it gives the kids a way home inside the game.

## Solution

- **Fullscreen on a tap.** While the game isn't fullscreen, any tap anywhere asks the browser for fullscreen. The same tap still does its normal job, such as pressing Draw or Bonking a Monster. When fullscreen is granted, the Kids top bar goes and the game fills the 16:10 screen with no bars. When it's refused or unsupported, nothing happens and the game looks as it does today.
- **Ask again after leaving.** Fullscreen ends whenever the page is left or the kid presses Back, and a browser only allows it after a tap. So the game asks on the first tap after every opening, and again on the next tap after any exit.
- **The way out stays.** The tablet's Back leaves fullscreen, and a second Back leaves the game. The Zoo's house button (Arcade ticket 02) goes straight to the Arcade, which isn't affected by the game's fullscreen.
- **The sideways turn stays.** No orientation lock is possible, so held upright the game is still drawn sideways (landscape ticket 02). In fullscreen the turned frame is 961×601, which the Arena fills exactly.
- **ADR 0002 is updated** to allow fullscreen on a tap, with the reasons above. The orientation-lock ban stays, now as a measured fact: the lock isn't available. A portrait layout stays ruled out.

## User Stories

1. As a kid, I want the game to fill the whole screen once I start playing, so that there are no blank bars and the top bar doesn't get in the way.
2. As a kid, I want my first tap to still do what I tapped, so that the game doesn't swallow it.
3. As a kid, I want the game to go back to fullscreen the next time I tap after it dropped out, so that I don't have to do anything special.
4. As a kid, I want Back to still get me out, so that I'm never stuck.
5. As a kid, I want the house button to take me back to the Arcade, so that I can pick another game.
6. As a kid holding the tablet upright, I want the fullscreen game still drawn sideways, so that I know to turn the tablet.
7. As a kid in a Catch or mid-drawing, I want going fullscreen not to reset anything, so that I don't lose my place.
8. As the dad, I want the game to look exactly as it does today if a tablet refuses fullscreen, so that nothing breaks.
9. As the dad, I want the game to never ask the browser for an orientation lock, since the tablet doesn't support one.
10. As the builder, I want ADR 0002 to say why fullscreen is now allowed, so that nobody re-litigates it.

## Implementation Decisions

- **A small fullscreen module** with one job: when asked, and only if the page isn't already fullscreen and the API exists, call `requestFullscreen` on the document element with `navigationUI: "hide"` (or the `webkit` version as a fallback). It swallows refusals and errors silently, with no message to the kid. It takes the `document` as a parameter so it can be tested with a fake.
- **Asked from one place:** a `pointerup` listener on the app root (not `pointerdown`: a finger touching down doesn't count as a user action for fullscreen, only lifting it does; found on the tablet 2026-11-09), in the capture phase and passive. It never stops or prevents the event, so the tap still reaches its button or canvas as normal. The listener stays on for the life of the page, so any tap after an exit asks again.
- **Re-fit is already handled.** Going fullscreen resizes the window, and the screen fit from landscape ticket 01/02 re-lays out on every resize without resetting state. Nothing new is needed. A gesture that is in progress during the resize (the very first tap) may map slightly off for that one gesture, which is acceptable.
- **No orientation lock**, no Screen Orientation API, and no manifest `display` or `orientation` change. Suite rule 6 (don't ask to be installed) is unaffected.
- **The house button is Arcade ticket 02**, not new work here. This spec only notes that it must also work while fullscreen: a link to `/` leaves the page, which ends fullscreen.
- **ADR 0002** is edited in place (it's one day old and nothing else depends on its wording). Its first decision is unchanged: landscape only, drawn sideways when upright, no portrait layout. It now says fullscreen is requested on a tap, with the probe's evidence, and that the orientation lock is unavailable, not just undocumented.
- **The probe page** (`public/fullscreen-probe/`) is deleted in ticket 01, and landscape ticket 04 is closed with a pointer here. Its one open question (does fullscreen also work when the game is opened through the Arcade from My Stuff?) moves to this spec's tablet check.

## Testing Decisions

- **Tested:** the fullscreen module, with a fake document. It asks when not fullscreen; it doesn't ask when already fullscreen; it uses the webkit fallback when that's all there is; it does nothing when neither API exists; and a rejected request doesn't throw. Prior art: the pure vitest suites in `src/core/*.test.ts`.
- **Not unit-tested, checked by hand:** that the first tap still lands, that the resize keeps state, and the look. In desktop Chrome or Edge, a tap makes the page fullscreen, Esc leaves it, and the next tap asks again.
- **On the tablet (ticket 02):** see that ticket.

## Out of Scope

- An orientation lock (measured: not available).
- A portrait layout.
- Painting the bars with Habitat scenery. Revisit only if a tablet refuses fullscreen in the real My Stuff → Arcade path.
- Any change to the Arcade or its suite rules.
- A "tap to play" splash screen. Any tap does it.

## Delivery

- `issues/01-fullscreen-on-tap.md`: the module, the listener, the ADR 0002 update, and deleting the probe.
- `issues/02-tablet-check.md`: for the builder, blocked by 01 and by Arcade ticket 02 (the house button).
- `issues/03-system-bars-jump.md`: found on the tablet, undecided. Every touch in fullscreen shows the tablet's bars and the game jumps.
