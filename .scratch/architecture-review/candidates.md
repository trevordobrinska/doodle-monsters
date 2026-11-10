# Architecture review, 2026-11-09 (parked)

Status: needs-triage

From `/improve-codebase-architecture`, scoped to the recent hot spots. Parked: **fix bugs first**. A refactor needs a known-good starting point, and any bug that can't get a regression test because there's no good seam shows which candidate to take first (see `/diagnosing-bugs`, phase 5). Picking a candidate starts at `/grill-with-docs`.

1. **One Screen module owns the fit and the resize** (Strong). `fitScreen(viewportSize(), ARENA)` runs in about 5 places. Four resize listeners only work in the right order, and that rule lives in a comment in `main.ts`. Bring to life has its own pointer math. The landscape commits each touched 8 to 10 files. Deepen: one fit, given to each surface along with its own pointer-to-arena mapping, and tested with a fake viewport. Respects ADR 0002.
2. **GameCore owns the end of the Round; `main.ts` becomes a DOM adapter** (Strong, top pick). `main.ts` is the most-changed file and has no tests. It holds the bubble-then-Zoo timing (1.5 s / 3.5 s) and remembers `core.saved().catch(...)` for only 3 of the 6 calls that save. Deepen: move that into GameCore and report save failures through the ZooStorage port (two adapters, so a real seam), testable with `newGame`/`runFor`.
3. **One Googly Eyes face module** (Strong). Three renderers each keep pupils and pop-on in their own way. Bug 9bb43d8 (a negative eye size) came from how a caller handled time, which the `popInScale` test doesn't cover. Deepen: a face that takes dt, the drawn box and the finger, tested with a recording fake 2D context.
4. **GameCore decides what's drawn and what's hit; the renderer only paints** (Worth exploring). The renderer guesses wall hits from `wasFlying`, with a known race, even though `tick` already returns `"wallHit"`. Shell's `curledUp` crosses the seam, and a new Trick means editing the renderer.
5. **One finger input module** (Worth exploring). The tap/Flick thresholds are untested because gestures needs a real canvas. `main.ts` tracks the finger again for the watching eyes. Deepen: take a small pointer source, like fullscreen's `TapTarget`.
6. **An internal Habitat module behind GameCore** (Speculative). Locality only. The interface and tests stay the same.

Already deep, leave alone: Tricks (5 adapters, tested through GameCore), `oval.ts`, `envelope.ts`, `fitScreen`, `fullscreen.ts`, the Clock/Dice ports, the `testing.ts` builders.

Housekeeping: `src/night1/` is throwaway. Keep it until bug 01 is settled, since its card 2 is the storage probe.

Bug link: bug 01 (Zoo emptied) found that the Zoo-load-failure path in `main.ts` is untested and fails silently. That supports candidate 2.
