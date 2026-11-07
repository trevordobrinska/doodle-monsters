# 02: Night 1 test page

**What to build:** A throwaway page published alongside the game that lets the builder check, on a Fire HD 8 in an Amazon Kids profile, everything the Night 1 checklist in `DESIGN.md` asks. Each check shows a clear pass/fail result on screen. It isn't part of the game and can be deleted after Night 1.

**Blocked by:** 01 (Walking skeleton).

**Status:** ready-for-agent

- [ ] Reachable at its own path on the GitHub Pages site
- [ ] Storage check: writes a timestamped record to IndexedDB and shows the last-saved time on every visit (to prove it survives closing, rebooting and a few days)
- [ ] Shows whether persistent storage was requested and granted, and the storage estimate if available
- [ ] Shows a per-profile marker (a random id created on first visit) so the two kid profiles can be compared for separate storage
- [ ] Backup check: a button that downloads a small file
- [ ] Restore check: a file picker that reads a chosen file and shows its contents
- [ ] Outbound call check: a button that fetches a known public HTTPS address and reports success or failure (for V1.5)
- [ ] A finger-drawing pad to judge smoothness
- [ ] A web app manifest so add-to-home-screen can be tried and fullscreen launch checked; the page shows whether it's running standalone
- [ ] Notes on the page how to connect remote debugging (adb + `chrome://inspect`)
