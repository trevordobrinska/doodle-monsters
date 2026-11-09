# 01: The zoo overlay follows the Habitat

**What to build:** In the Zoo, the yellow Draw button, the bouncing "Draw your first Monster" arrow and its text, and the Habitat arrows all sit inside the Habitat's rectangle (the 1280×800 picture, bars excluded), not at the window's edges. On the tablet's landscape window, which the Kids top bar makes shorter than 800, the Draw button no longer overlaps the right bar and the first-time arrow no longer bounces in and out of the Habitat's edge. Buttons keep their current pixel sizes.

To get there, add the pure **screen fit** module from the spec (window size + 1280×800 surface size in, a fit out), with no turn yet: it always reports not turned, and the frame is the window. The Letterbox takes its scale and offsets from the fit, and the zoo overlay is positioned and sized to the fit's rect on start-up and on every resize. See `.scratch/landscape/spec.md`.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] A pure screen-fit module returns the rect (where the 1280×800 surface sits, scaled to fit and centred) and maps a pointer position to surface coordinates. It reads no DOM; callers pass the window size in
- [x] Vitest tests with plain numbers: a 1280×800 window (no bars, 1:1 mapping), a short landscape window such as 1280×720 (bars of the expected width on the left and right, rect centred), and a finger in a bar mapping outside the Arena
- [x] The Letterbox uses the fit. Its interface (resize, toArena, begin) is unchanged, so taps, Flicks, Googly Eye finger tracking and Name Card taps behave exactly as before
- [x] The zoo overlay sits on the fit's rect and follows it on resize. The Draw button, first-time arrow and text, and Habitat arrows keep their current offsets and pixel sizes, now measured from the Habitat's edges
- [x] The first-time arrow's bounce stays entirely inside the Habitat
- [ ] Checked by hand in a desktop browser with a short landscape window and a portrait-shaped window: nothing in the zoo overlay sits on a bar
- [x] Typecheck and tests pass

## Comments

- Built by an agent (2026-11-08). The screen fit is `src/core/screenFit.ts`: `fitScreen(window, surface)` returns `{ turned, frame, rect, scale, toSurface }`. For now `turned` is always false and `frame` is the window, so ticket 02 can add the turn without changing that shape. The Letterbox takes its scale, offsets and `toArena` from the fit. `windowSize()` in `src/render/letterbox.ts` reads the window size from `document.documentElement`. The game canvas is now sized to 100% of that box instead of 100vw/100vh, so the canvas and the fit always agree. `main.ts` places `#zoo` on the fit's rect at start-up and on every resize. `#zoo` clips anything that overflows it, so the first-time arrow's bounce can't leave the Habitat. The tall-window tests belong to ticket 02, since that ticket turns tall windows.
- **Left for a human:** the "checked by hand in a desktop browser" box is still unticked because an agent can't do it. Resize a desktop browser to a short landscape shape and then a portrait shape. Check that the Draw button, the first-time arrow and its text, the Habitat arrows and the dots all sit inside the Habitat, off the bars. Also check that taps on Monsters (Name Cards), Googly Eye finger tracking, and Catch Bonks and Flicks still land where you aim.
