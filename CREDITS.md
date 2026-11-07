# Credits

## Sound effects

The game loads these files from `public/sounds/`:

| File                         | Plays when                          | Source      |
| ---------------------------- | ----------------------------------- | ----------- |
| `public/sounds/bonk.wav`     | a Bonk lands                        | placeholder |
| `public/sounds/boing.wav`    | a tap lands on a Stunned Monster    | placeholder |
| `public/sounds/wall-hit.wav` | a Flicked Monster hits the wall     | placeholder |
| `public/sounds/caught.wav`   | the Monster is caught in its bubble | placeholder |

**Placeholders** are synthesised by `scripts/make-temp-sounds.py` (no third-party
audio, nothing to license). They're stand-ins until we find sounds we love.

The plan is to replace them with **Kenney** CC0 sound effects
(https://kenney.nl, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)),
crediting each one here with its pack and original file name even though CC0
doesn't require it. To replace a sound, drop the new file into `public/sounds/`,
update `FILES` in `src/sound/sound.ts`, and update the row above.

Each Monster plays these pitched up or down a little (its Voice, 0.8×–1.25×), so
pick sounds that still work a bit lower or higher. A missing file just stays
silent.
