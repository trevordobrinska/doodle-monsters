# 01: Fullscreen on a tap

**What to build:** While the game isn't fullscreen, any tap anywhere asks the browser for fullscreen. The tap still does its normal job. If fullscreen is refused or unsupported, nothing visible happens. Going fullscreen re-fits the game through the existing screen fit without resetting anything. See `.scratch/fullscreen/spec.md`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A small fullscreen module asks for fullscreen (`requestFullscreen({ navigationUI: "hide" })`, falling back to `webkitRequestFullscreen`). It only asks when the page isn't already fullscreen and an API exists, swallows refusals silently, and takes the document as a parameter
- [ ] Vitest tests with a fake document: asks when not fullscreen; skips when already fullscreen; uses the webkit fallback; does nothing without an API; a rejected request doesn't throw
- [ ] One capture-phase, passive `pointerdown` listener on the app root calls it on every tap and never stops or prevents the event, so the first tap still presses its button, Bonks or draws
- [ ] No orientation lock, no Screen Orientation API, and no manifest change
- [ ] ADR 0002 is updated as the spec says: fullscreen on a tap allowed, with the probe evidence; orientation lock unavailable (measured); still no portrait layout
- [ ] `public/fullscreen-probe/` is deleted. `.scratch/landscape/issues/04-fullscreen-probe.md` is set to resolved, with a pointer to this spec (its My Stuff check moves to ticket 02)
- [ ] Checked by hand in desktop Chrome or Edge: a tap goes fullscreen and still does its job; Esc leaves fullscreen; the next tap asks again; a Catch and a half-finished drawing survive the switch
- [ ] Typecheck, tests and build pass
