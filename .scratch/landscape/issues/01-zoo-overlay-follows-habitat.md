# 01: The zoo overlay follows the Habitat

**What to build:** In the Zoo, the yellow Draw button, the bouncing "Draw your first Monster" arrow and its text, and the Habitat arrows all sit inside the Habitat's rectangle (the 1280×800 picture, bars excluded), not at the window's edges. On the tablet's landscape window, which the Kids top bar makes shorter than 800, the Draw button no longer overlaps the right bar and the first-time arrow no longer bounces in and out of the Habitat's edge. Buttons keep their current pixel sizes.

To get there, add the pure **screen fit** module from the spec (window size + 1280×800 surface size in, a fit out), with no turn yet: it always reports not turned, and the frame is the window. The Letterbox takes its scale and offsets from the fit, and the zoo overlay is positioned and sized to the fit's rect on start-up and on every resize. See `.scratch/landscape/spec.md`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A pure screen-fit module returns the rect (where the 1280×800 surface sits, scaled to fit and centred) and maps a pointer position to surface coordinates. It reads no DOM; callers pass the window size in
- [ ] Vitest tests with plain numbers: a 1280×800 window (no bars, 1:1 mapping), a short landscape window such as 1280×720 (bars of the expected width on the left and right, rect centred), and a finger in a bar mapping outside the Arena
- [ ] The Letterbox uses the fit. Its interface (resize, toArena, begin) is unchanged, so taps, Flicks, Googly Eye finger tracking and Name Card taps behave exactly as before
- [ ] The zoo overlay sits on the fit's rect and follows it on resize. The Draw button, first-time arrow and text, and Habitat arrows keep their current offsets and pixel sizes, now measured from the Habitat's edges
- [ ] The first-time arrow's bounce stays entirely inside the Habitat
- [ ] Checked by hand in a desktop browser with a short landscape window and a portrait-shaped window: nothing in the zoo overlay sits on a bar
- [ ] Typecheck and tests pass
