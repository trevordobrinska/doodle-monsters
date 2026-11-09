# 02: Always landscape

**What to build:** When the window is taller than it is wide (tablet held upright), the whole game draws itself turned 90° to fill the long side of the screen, so it looks sideways and the kid turns the tablet. The layout never switches to a portrait version. When the tablet's own auto-rotate kicks in, the game un-turns, so from the kid's point of view it stays put. Every screen gets the turn: the Zoo and its overlay, the Catch, the drawing screen, Bring to life and the Name Card. Taps, Flicks, brush strokes and Googly Eye placement land under the finger whichever way the game is drawn. Turning the tablet mid-Catch, mid-drawing, on Bring to life or on a Name Card resets nothing.

No Fullscreen API, no Screen Orientation API, no manifest orientation. See `.scratch/landscape/spec.md` and ADR 0002.

**Blocked by:** 01 (it adds the screen fit module this extends).

**Status:** ready-for-agent

- [ ] The screen fit reports **turned** when the window is taller than wide. When turned, the frame is the window's size with width and height swapped, and pointer mapping undoes the turn
- [ ] The turn direction is one named constant, chosen so that holding the tablet camera-on-top in landscape shows the picture upright (confirmed on the tablet in ticket 03)
- [ ] Vitest tests with plain numbers: a tall window such as 800×1280 (turned, frame 1280×800, rect fills it), a tall window with a top bar such as 800×1200 (turned, with bars), the rect's four corners as tapped on the real upright screen landing on the Arena's four corners in the right order, the centre landing at the centre, and a swipe's direction surviving the turn
- [ ] All the screens sit in one app root. When turned it's sized to the frame and rotated with a CSS transform; otherwise it fills the window untransformed
- [ ] The Letterbox (Habitat and Catch), the drawing screen and Bring to life map pointers through the fit, never by measuring the canvas's on-screen rectangle
- [ ] The fit is applied at start-up (the first frame is already right) and on every resize. A resize only re-lays out and repaints: a running Catch keeps going, drawn strokes stay, and Bring to life choices and an open Name Card stay
- [ ] Checked by hand in a desktop browser, switching the window between portrait and landscape shapes: Bonks, Flicks, drawing, eye placement, Name Card taps and the zoo overlay buttons all land under the pointer, including mid-Catch and mid-drawing
- [ ] Typecheck and tests pass
