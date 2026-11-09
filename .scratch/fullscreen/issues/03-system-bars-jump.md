# 03: The tablet's bars make the game jump in fullscreen

**Blocked by:** None

**Status:** needs-triage

## Problem

Seen on the Fire HD 8 on 2026-11-09, after fullscreen on a tap went live (`525beae`), with the game opened from My Stuff → Arcade.

Once the game is fullscreen, **every touch** brings back the tablet's own bars: the status bar (time, battery) and the Back/Home bar. What the builder saw:

1. The bars hide again **by themselves after a few seconds**.
2. When they show, **the game jumps**: the page shrinks, and the screen fit re-lays the game out smaller. When the bars hide, it jumps back.
3. The **Kids top bar stays gone** the whole time. Only the tablet's bars come back.
4. Netflix in fullscreen doesn't do this: a tap shows Netflix's own playback overlay, not the tablet's bars.

## What we think is going on

- Netflix is a native app and can hide the bars in the "sticky" way, where a touch doesn't bring them back. A web page inside the Kids app gets whatever fullscreen mode the Kids app chooses. Here that mode brings the bars back on any touch and hides them again on a timer. Nothing the page can call changes that. `navigationUI: "hide"` is already passed.
- The jump is ours: the page really does shrink while the bars show, and every screen re-fits on `resize` through `viewportSize()` (`src/render/viewport.ts`), which is the one place the size is read.
- Since the game is touched almost all the time (drawing, Catches), the bars will be up for much of play.
- Not yet checked: whether the page shrinks from the bottom only or also gets pushed down from the top, and the exact sizes with the bars up and down.

## Options (undecided)

1. **Fit to the bars-up size.** While fullscreen, keep the smallest size seen in the current orientation. The game jumps once, the first time the bars show, then holds still. Thin empty edges show when the bars hide. The Kids top bar stays gone, so the game is still bigger than before fullscreen, and nothing is ever under the bars. Reset when the tablet turns or fullscreen ends. (This was the agent's recommendation.)
2. **Hold the full size.** Ignore the shrink while fullscreen. The game never rescales, but for a few seconds after each touch the bars cover its edges, including buttons near them. If the page is also pushed down from the top, everything shifts a little.
3. **Drop fullscreen.** Go back to the Kids top bar and blank bars. The spec's Out of Scope fallback was painting those bars with Habitat scenery.

Also worth weighing: with the Back/Home bar popping up on every touch, a second quick tap near the bottom edge can press Back or Home by accident. That happens in fullscreen whichever of options 1 and 2 is picked, and is avoided only by option 3.

## Next step

Grill this with the builder, pick an option, then turn it into a ticket (it may need a quick size readout on the tablet first).
