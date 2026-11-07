# 05: Sound

**What to build:** The Catch has fun sound effects: Bonk, "boing" on a Stunned tap, Flick/wall hit and the bubble catch. Each Monster's sounds are pitched a little differently so it has its own voice. No music.

**Blocked by:** 03 (First Catch).

**Status:** done

- [x] ~~Uses Kenney.nl CC0 sound effects~~ Uses our own synthesised sound effects bundled with the site, noted in `CREDITS.md` (changed 2026-11-07, see comments)
- [x] Sounds play on Bonk, Stunned tap, wall hit and catch
- [x] Each Monster gets a pitch shift chosen once (from the dice) and reused for all its sounds
- [x] Audio starts only after the first touch, so the browser doesn't block it
- [x] Sound logic stays out of the game core; the core only reports what happened

## Comments

**2026-11-07 (agent):** Code done. The core rolls each Monster's Voice (a pitch multiplier, 0.8×–1.25×) once from the dice and exposes it as `monster().voice`. `tick(dt)` now returns `"wallHit"` on the frame a Flicked Monster hits the wall, and ordinary bounces return `"none"`. Tests are in `src/core/voice.test.ts` and `src/core/flick.test.ts`. Playback lives in `src/sound/sound.ts`, and `src/main.ts` decides which sound goes with each result. Sounds are decoded ahead of time in an `OfflineAudioContext`. The real `AudioContext` is only created on the first touch (pointerdown or pointerup, since Chrome only lets a touch unlock audio on finger-up). A Flick has no sound of its own; it sounds when the Monster hits the wall.

kenney.nl blocks automated downloads, so the agent made four synthesised sounds with `scripts/make-sounds.py` instead.

**2026-11-07 (human):** Sounds are good. The synthesised sounds are permanent for V1, no Kenney replacement needed. Not yet checked: first-touch audio unlock on the Fire HD 8.
