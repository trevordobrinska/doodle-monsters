# 02: Always landscape

**What to build:** When the window is taller than it is wide (tablet held upright), the whole game draws itself turned 90° to fill the long side of the screen, so it looks sideways and the kid turns the tablet. The layout never switches to a portrait version. When the tablet's own auto-rotate kicks in, the game un-turns, so from the kid's point of view it stays put. Every screen gets the turn: the Zoo and its overlay, the Catch, the drawing screen, Bring to life and the Name Card. Taps, Flicks, brush strokes and Googly Eye placement land under the finger whichever way the game is drawn. Turning the tablet mid-Catch, mid-drawing, on Bring to life or on a Name Card resets nothing.

No Fullscreen API, no Screen Orientation API, no manifest orientation. See `.scratch/landscape/spec.md` and ADR 0002.

**Blocked by:** 01 (it adds the screen fit module this extends).

**Status:** done

- [x] The screen fit reports **turned** when the window is taller than wide. When turned, the frame is the window's size with width and height swapped, and pointer mapping undoes the turn
- [x] The turn direction is one named constant, chosen so that holding the tablet camera-on-top in landscape shows the picture upright (confirmed on the tablet in ticket 03)
- [x] Vitest tests with plain numbers: a tall window such as 800×1280 (turned, frame 1280×800, rect fills it), a tall window with a top bar such as 800×1200 (turned, with bars), the rect's four corners as tapped on the real upright screen landing on the Arena's four corners in the right order, the centre landing at the centre, and a swipe's direction surviving the turn
- [x] All the screens sit in one app root. When turned it's sized to the frame and rotated with a CSS transform; otherwise it fills the window untransformed
- [x] The Letterbox (Habitat and Catch), the drawing screen and Bring to life map pointers through the fit, never by measuring the canvas's on-screen rectangle
- [x] The fit is applied at start-up (the first frame is already right) and on every resize. A resize only re-lays out and repaints: a running Catch keeps going, drawn strokes stay, and Bring to life choices and an open Name Card stay
- [ ] Checked by hand in a desktop browser, switching the window between portrait and landscape shapes: Bonks, Flicks, drawing, eye placement, Name Card taps and the zoo overlay buttons all land under the pointer, including mid-Catch and mid-drawing
- [x] Typecheck and tests pass

## Comments

- Built by an agent (2026-11-08). The turn constant is `TURN_DEGREES` in `src/core/screenFit.ts`, set to **-90**: a quarter turn anticlockwise, so held upright the picture's top runs down the screen's left edge. I picked it because the Fire tablets are landscape-first, and Chromium reports portrait-primary on a landscape-first device as the tablet turned a quarter anticlockwise from camera-on-top landscape. That puts the front camera on the left edge when upright, so a quarter turn clockwise brings the camera to the top and stands the picture upright. If ticket 03 finds it's the wrong way round, set it to `90`. The fit's sums and its CSS `transform` both follow the constant.
- The fit now also returns `transform` (the CSS that turns the app root, `"none"` when not turned) and `toFrame` (a pointer in frame pixels, the turn undone). Every screen sits in `#app` in `index.html`. `placeAppRoot()` in `src/main.ts` sizes it to the frame and applies the transform at start-up and on every resize. Its resize listener is registered before the screens' listeners, so they measure the new frame. `#app` is a size container, so fixed-position screens fill the frame rather than the window. The Name Card's `92vw`/`90vh` limits now use `cqw`/`cqh`, with the old `vw`/`vh` values kept as a fallback. Canvases are sized to 100% of their box instead of `100vw`/`100vh`.
- The drawing screen takes its scale, offsets and pointer sums from the fit (`fit.toSurface`, then clamped as before). Bring to life maps pointers with `fit.toFrame` plus the canvas's layout offset inside the screen. Layout offsets ignore the turn. Nothing calls `getBoundingClientRect` any more. Resizes only re-lay out and repaint: strokes, eyes, names, the Catch and an open Name Card are untouched.
- **Left for a human:** the desktop-browser check is still unticked. In `npm run dev`, resize the window between landscape, short-landscape and portrait shapes, or use DevTools device mode with a tall size such as 800×1280. Portrait should show the whole game turned, with its top along the screen's left edge. Check that Bonks, Flicks (the Monster goes the way you swiped), brush strokes (ink appears under the pointer), Googly Eye placement and dragging, Name Card taps and the zoo overlay buttons all land under the pointer. Resize mid-Catch, mid-drawing, on Bring to life and with a Name Card open, and check that nothing resets. Also check that the Name Card still fits when turned.
