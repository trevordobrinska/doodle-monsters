# 06: Draw your Monster

**What to build:** A kid draws their own Monster and then Catches it instead of the placeholder blob. The drawing screen is full-screen with about 8 bright colors, thick and thin brushes, undo and start over, with no eraser and no timer. "Done" only works once there's enough ink. The drawing is trimmed to its ink with a transparent background and resized so every Monster is the same size.

**Blocked by:** 03 (First Catch).

**Status:** ready-for-agent

- [ ] Full-screen drawing canvas with smooth finger strokes
- [ ] About 8 bright colors, a thick brush and a thin brush
- [ ] Undo removes the last stroke; start over clears the canvas
- [ ] "Done" is disabled until a minimum amount of ink is drawn
- [ ] On "Done", the drawing is trimmed to its ink, keeps a transparent background and is resized to the standard Monster size (a modest image size)
- [ ] The drawing's main color is worked out and passed to the core with the other ink facts
- [ ] The Catch uses the drawn image, and the hit area matches the Monster
- [ ] Core: the Round moves from Draw to Catch when a drawing is finished; tested through the core
