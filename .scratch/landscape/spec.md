# Spec: Always landscape

Status: ready-for-agent

Sources: a grilling session on 2026-11-08 after the game was first opened from the Dobrinska Arcade on the Fire HD 8s; `DESIGN.md`, `GLOSSARY.md`, ADR 0001, and the Night 1 results (V1 ticket 13).

## Problem Statement

The game now opens from the Arcade on the tablets (through the kid's My Stuff icon, inside the Amazon Kids web wrapper, with its top bar showing). Two things go wrong:

1. **The zoo's buttons sit on the blank bars.** The Habitat is drawn at a fixed 1280×800 shape and fitted to the window, with blank bars where the window's shape differs. The Kids top bar makes a landscape window shorter than 800, so the Habitat gets blank bars on the left and right. The yellow Draw button and the bouncing "Draw your first Monster" arrow are pinned to the window's corner, not the Habitat's, so the Draw button overlaps the right bar and the bouncing prompt goes in and out of the Habitat's edge. Held upright, the prompt bounces along the top edge of the bottom bar.
2. **The game switches between portrait and landscape as the tablet turns.** Held upright, the 1280×800 game shrinks into a thin band with large bars above and below. The dad wants the game to always appear in landscape, so the kids turn the tablet to match, not watch the game re-lay itself out.

## Solution

- **Landscape only, drawn sideways when upright.** When the window is taller than it is wide, the whole game draws itself turned 90° so it fills the long side of the screen. It looks sideways, so the obvious thing is to turn the tablet. The layout never changes to a portrait version. When the tablet's own auto-rotate kicks in, the game simply un-turns, so from the kid's point of view it stays put. It's turned to match the Fire tablet's natural landscape (front camera along the top edge).
- **The zoo's buttons live inside the Habitat.** The zoo overlay (the Draw button, the first-time arrow and its text, the Habitat arrows) is placed on the Habitat's rectangle (inside the bars), not the window. Buttons keep their current pixel sizes, so they stay easy to tap.
- **Turning the tablet mid-game changes nothing.** A Catch keeps running, a half-finished drawing keeps its strokes, and Bring to life and the Name Card keep their state. Taps, Flicks and brush strokes land in the right place whichever way the game is drawn.
- **No fullscreen and no browser orientation lock.** Either would hide the Kids top bar, which should stay. Silk's support for them in a Kids profile is also undocumented.

## User Stories

1. As a kid, I want the game to always appear in landscape, so that it looks the same every time I open it.
2. As a kid holding the tablet upright, I want the game to appear sideways, so that I can tell I should turn the tablet.
3. As a kid, I want the game to not jump into a different layout when I turn the tablet, so that I don't lose my place.
4. As a kid who turns the tablet to landscape, I want the game to stay put while the tablet's screen rotates, so that turning feels natural.
5. As a kid, I want the picture to be the right way up when I hold the tablet camera-on-top, so that the usual way of holding it just works.
6. As a kid, I want the yellow Draw button to sit inside the Habitat's corner, so that it doesn't hang off the edge into a blank bar.
7. As a kid opening the game for the first time, I want the "Draw your first Monster" arrow to bounce inside the Habitat, pointing at the Draw button, so that it clearly belongs to the zoo.
8. As a kid with a big Zoo, I want the Habitat arrows at the left and right edges of the Habitat, not out on the blank bars, so that I can find them.
9. As a kid, I want the zoo's buttons to stay big even when the Habitat is shrunk to fit, so that they're easy to tap.
10. As a kid tapping a Monster in the Zoo while the game is sideways, I want its Name Card to open for the Monster I tapped, so that taps go where I aim.
11. As a kid in the Zoo, I want the Monsters' Googly Eyes to follow my finger correctly whichever way the game is drawn, so that the eyes look at me.
12. As a kid in a Catch, I want my Bonks to land where I tap whichever way the game is drawn, so that the Catch is fair.
13. As a kid in a Catch, I want my Flicks to fling the Monster in the direction I swiped whichever way the game is drawn, so that Flicks feel right.
14. As a kid in a Catch, I want the Catch to keep going if I turn the tablet halfway through, so that I don't lose my progress.
15. As a kid drawing a Monster, I want my brush strokes to appear under my finger whichever way the game is drawn, so that drawing works.
16. As a kid drawing a Monster, I want my drawing to still be there after I turn the tablet, so that I don't have to start over.
17. As a kid on Bring to life, I want the Googly Eyes I place to land where I tap whichever way the game is drawn, so that my Monster looks how I meant.
18. As a kid on Bring to life, I want my chosen eyes, Temperament and name to survive turning the tablet, so that I don't redo them.
19. As a kid on a Name Card, I want the card to stay open with the same Monster after turning the tablet, so that nothing surprising happens.
20. As a kid, I want the drawing screen, Bring to life and the Name Card to be drawn sideways too when the tablet is upright, so that every screen behaves the same.
21. As a kid, I want the Kids top bar to stay visible, so that I can leave the game the usual way.
22. As the dad, I want the game to work whether Auto-rotate is on or off, so that I don't have to manage a tablet setting.
23. As the dad, I want an optional tip about turning off Auto-rotate while the tablet is sideways, so that I can stop the screen rotating if I want to.
24. As the dad, I want the game to never ask the tablet for fullscreen or an orientation lock, so that the Kids wrapper behaves as it does for every other allowed site.
25. As the builder, I want all the "finger position → game position" sums in one tested module, so that the sideways turn can't put taps in the wrong place on one screen but not another.
26. As the builder, I want the zoo overlay's position to come from the same module, so that the buttons and the Habitat can never disagree about where the Habitat is.
27. As the builder, I want the decision recorded in an ADR, so that nobody later "fixes" it by adding a portrait layout or a manifest orientation.
28. As the builder, I want to check it in a desktop browser with a portrait-shaped window before taking it to the tablet, so that I catch mistakes cheaply.

## Implementation Decisions

- **New pure module, the screen fit.** One function takes the window size and the surface size (always 1280×800: the Arena and the drawing surface share it) and returns a fit:
  - **turned:** whether the window is taller than it is wide.
  - **frame:** the landscape size the app lays itself out in: the window's size, with width and height swapped when turned.
  - **rect:** where the 1280×800 surface sits inside the frame, scaled as big as it fits and centred, bars excluded.
  - **toSurface(clientX, clientY):** turns a pointer position as the browser reports it (window pixels, never turned) into surface coordinates, undoing the turn first.
  It reads no DOM and no globals; callers pass the window size in. Device pixel ratio stays the callers' business (canvas backing-store size), not the fit's.
- **The turn direction is one constant** in the fit module, picked so that rotating the tablet into camera-on-top landscape gives an upright picture. Its exact value is confirmed on the tablet.
- **Every pointer mapper uses the fit.** The Letterbox (used by the Habitat and the Catch renderer), the drawing screen and Bring to life stop measuring the canvas's on-screen rectangle themselves and take positions from the fit's `toSurface`. Measuring the on-screen rectangle gives the rotated bounding box once the app is turned, so it can't be kept. The Letterbox's existing interface (resize, toArena, begin) stays, so its callers (gestures, the Googly Eye finger tracking, Name Card taps) don't change.
- **One app-wide turn.** All the screens (Habitat canvas, zoo overlay, drawing screen, Bring to life, Name Card) sit inside a single app root. When the fit says turned, that root is sized to the frame and rotated 90° with a CSS transform. Otherwise it fills the window untransformed. HTML buttons need no help: browsers hit-test through CSS transforms. Only canvas pointer sums need the fit.
- **Re-fit on resize.** The fit is recomputed on every window resize (which is what a rotation is to the page) and at start-up, so the very first frame is already right. Resizing only re-lays out and repaints. It never resets game state, strokes or screens.
- **The zoo overlay is placed on the fit's rect.** The overlay is positioned and sized to the rect, not the window. Its children keep their existing corner and edge offsets and pixel sizes, so they're relative to the Habitat now. The bouncing first-time arrow stays entirely inside the rect.
- **No Fullscreen API, no Screen Orientation API, no manifest orientation** for the game.
- **The other full-window screens** (drawing screen, Bring to life, Name Card) get the turn but otherwise keep their layout. Fix them only if the tablet check shows a problem.
- **ADR 0002** records: landscape only, drawn sideways when upright, no fullscreen or orientation lock (to keep the Kids top bar; Kids profiles can't install anything), no portrait version (every rule is tuned to 1280×800).
- **V1 ticket 15** gets a comment: its "manifest with fullscreen landscape display" item is overtaken by events (nothing is installed; orientation is handled by this feature).
- **Delivery in three tickets** (see `issues/`): (1) the zoo overlay follows the Habitat's rect, which on its own fixes the bounce and introduces the fit module without the turn; (2) always landscape, blocked by 1 (the app-wide turn, the fit's turn and all pointer mappers through the fit); (3) a tablet check for the builder, blocked by 1 and 2.

## Testing Decisions

- **A good test here** gives the fit plain numbers and checks what comes out: bar sizes, rectangle corners, where a finger lands in the Arena. It doesn't test how the module computes them, and it never touches the DOM.
- **Tested module: the screen fit only.** Cases to cover:
  - A 1280×800 window: not turned, no bars, finger maps 1:1.
  - A short landscape window (the Kids top bar case, e.g. 1280×720): not turned, bars on the left and right of the expected width, rect centred.
  - A tall window (e.g. 800×1280): turned, the frame is 1280×800, the rect fills it.
  - A tall window with a top bar (e.g. 800×1200): turned, with bars in the frame.
  - Finger mapping when turned: the rect's four corners, as tapped on the real (upright) screen, land on the Arena's four corners in the right order for the chosen turn direction, and the centre lands at the centre.
  - A finger in a bar maps outside the Arena (below 0 or beyond 1280×800), so callers that clamp (the drawing screen) or ignore misses (taps) keep working.
  - A swipe's direction survives the turn: two points along the real screen map to the expected direction in the Arena (for Flicks).
- **Prior art:** the pure vitest suites in `src/core/*.test.ts` (for example the Zoo and Catch tests): plain inputs, behaviour-named `it` blocks, no DOM.
- **Not unit-tested, checked by hand:** the CSS turn, the overlay sitting on the rect, and state surviving a resize. Check them in a desktop browser with the window resized to portrait and short-landscape shapes. Then on both tablets: open from the Arcade held upright and held landscape; turn mid-Catch, mid-drawing and on Bring to life; with Auto-rotate on and off; confirm camera-on-top shows the picture upright and the Kids top bar stays.

## Out of Scope

- A portrait layout or a portrait-tuned Arena.
- The Fullscreen API, the Screen Orientation API and a manifest `orientation` for the game.
- Changing the Arcade, including its `SUITE-RULES.md`. This is a Doodle Monsters decision only.
- Re-laying out the drawing screen, Bring to life or the Name Card beyond the turn, unless the tablet check finds a problem.
- Making the Habitat fill the bars (stretching or cropping the 1280×800 Arena).
- The Night 1 test page (it's being removed).

## Further Notes

- **Optional parent tip:** Fire OS has an Auto-rotate toggle in the Quick Settings pull-down. Guides say turning it off with the tablet held sideways keeps it landscape. **Confirmed 2026-11-08: the toggle is in a Kids profile's pull-down**, so a kid can turn it back on. That's one more reason the game must not rely on it. Still unchecked: whether the setting carries across profile switches.
- Research on Silk (2026-11-08) found nothing confirming Silk supports orientation locking in a Kids profile. Silk is Chromium-based, so a lock would at least need fullscreen, which would hide the Kids top bar. That's why it's out.
- The bars come from the Amazon Kids web wrapper's top bar, not Silk's address bar: the Arcade opens from My Stuff without an address bar.
