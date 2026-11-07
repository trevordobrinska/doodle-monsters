# 06: Draw your Monster

**What to build:** A kid draws their own Monster and then Catches it instead of the placeholder blob. The drawing screen is full-screen with about 8 bright colors, thick and thin brushes, undo and start over, with no eraser and no timer. "Done" only works once there's enough ink. The drawing is trimmed to its ink with a transparent background and resized so every Monster is the same size.

**Blocked by:** 03 (First Catch).

**Status:** ready-for-human

- [x] Full-screen drawing canvas with smooth finger strokes
- [x] About 8 bright colors, a thick brush and a thin brush
- [x] Undo removes the last stroke; start over clears the canvas
- [x] "Done" is disabled until a minimum amount of ink is drawn
- [x] On "Done", the drawing is trimmed to its ink, keeps a transparent background and is resized to the standard Monster size (a modest image size)
- [x] The drawing's main color is worked out and passed to the core with the other ink facts
- [x] The Catch uses the drawn image, and the hit area matches the Monster
- [x] Core: the Round moves from Draw to Catch when a drawing is finished; tested through the core

## Comments

**2026-11-07 (agent):** Code done. The core now owns the Round's Draw → Catch step (`phase()`, `finishDrawing(ink)`, `enoughInk(amount)` in `src/core/gameCore.ts`), tested in `src/core/round.test.ts` (12 tests). The drawing model is in `src/draw/drawing.ts` and the screen in `src/draw/drawScreen.ts`. The renderer now draws the kid's image instead of the blob. Choices made along the way:
- **The same size is a core rule.** The core scales each drawing's longest side to 150 arena units and keeps its shape. The image itself is stored with its longest side at 256 px.
- **Hit area.** It's an oval that fills the drawing's box, plus the usual touch slack. Walls bounce off the box edges. `MonsterView.radius` is gone, replaced by `width`/`height`.
- **Ink.** The amount is estimated from the strokes (length × brush width), so going over the same spot again counts again. The minimum is about a hand-span of thin line. The main color is the palette color with the most ink, passed to the core as its name (e.g. "purple"), ready for the Bio.
- **Not asked for:** "Start over" needs a second tap ("Sure? Tap again") so a 10-minute drawing can't be wiped by accident.
- **Placeholder until ticket 07:** two stand-in eyes sit near the top of the drawing, so spiral and sleepy eyes still show. Tapping after a catch starts a new Round on the drawing screen.

Known rough edges to check while playtesting:
- A very thin drawing (one long straight line) makes a sliver of a Monster that's hard to hit.
- Ink dragged under the toolbar still counts, even though it's hidden.

Smoke-tested in headless Edge at 960×600 (the Fire HD 8's CSS size), with no console errors. It still needs a human playtest for how drawing with a finger feels.

