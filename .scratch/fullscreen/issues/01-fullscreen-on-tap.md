# 01: Fullscreen on a tap

**What to build:** While the game isn't fullscreen, any tap anywhere asks the browser for fullscreen. The tap still does its normal job. If fullscreen is refused or unsupported, nothing visible happens. Going fullscreen re-fits the game through the existing screen fit without resetting anything. See `.scratch/fullscreen/spec.md`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-human

- [x] A small fullscreen module asks for fullscreen (`requestFullscreen({ navigationUI: "hide" })`, falling back to `webkitRequestFullscreen`). It only asks when the page isn't already fullscreen and an API exists, swallows refusals silently, and takes the document as a parameter
- [x] Vitest tests with a fake document: asks when not fullscreen; skips when already fullscreen; uses the webkit fallback; does nothing without an API; a rejected request doesn't throw
- [x] One capture-phase, passive `pointerup` listener (was `pointerdown`, see the 2026-11-09 comment) on the app root calls it on every tap and never stops or prevents the event, so the first tap still presses its button, Bonks or draws
- [x] No orientation lock, no Screen Orientation API, and no manifest change
- [x] ADR 0002 is updated as the spec says: fullscreen on a tap allowed, with the probe evidence; orientation lock unavailable (measured); still no portrait layout
- [x] `public/fullscreen-probe/` is deleted. `.scratch/landscape/issues/04-fullscreen-probe.md` is set to resolved, with a pointer to this spec (its My Stuff check moves to ticket 02)
- [ ] Checked by hand in desktop Chrome or Edge: a tap goes fullscreen and still does its job; Esc leaves fullscreen; the next tap asks again; a Catch and a half-finished drawing survive the switch
- [x] Typecheck, tests and build pass

## Comments

**2026-11-08 (agent).** Built test-first. The module is `src/input/fullscreen.ts` (`askForFullscreen(doc)`), tested in `src/input/fullscreen.test.ts` with a fake document (7 tests, including a webkit-only page that's already fullscreen and a request that throws instead of rejecting). The listener is in `src/main.ts`, right after the app root is placed. ADR 0002 is rewritten in place, the probe is deleted and landscape ticket 04 is resolved. `npm run typecheck`, `npm test` (199 passing) and `npm run build` pass.

**Not done: the hand check in desktop Chrome or Edge.** An agent can't tap a real browser here, so that box is left unchecked for the builder: run `npm run dev`, tap Draw (it should go fullscreen and open the drawing surface), press Esc, tap again (fullscreen again), and check that a Catch in progress and a half-finished drawing survive going in and out.

**2026-11-09 (builder, recorded by agent), first tablet run.** Tapping Draw didn't go fullscreen; the first drawn line did. Cause: browsers don't count a finger touching down as a user action that allows fullscreen, only lifting it (the probe used a click, which comes after the lift). The Draw tap's request was refused, and its lift let the next touch-down through. Fixed by asking on `pointerup`. Also seen: once fullscreen, every touch brings back the tablet's status bar and Back/Home bar. Not yet understood; see ticket 02.

