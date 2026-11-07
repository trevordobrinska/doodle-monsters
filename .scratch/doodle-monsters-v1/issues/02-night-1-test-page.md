# 02: Night 1 test page

**What to build:** A throwaway page published alongside the game that lets the builder check, on a Fire HD 8 in an Amazon Kids profile, everything the Night 1 checklist in `DESIGN.md` asks. Each check shows a clear pass/fail result on screen. It isn't part of the game and can be deleted after Night 1.

**Blocked by:** 01 (Walking skeleton).

**Status:** ready-for-human

- [x] Reachable at its own path on the GitHub Pages site
- [x] Storage check: writes a timestamped record to IndexedDB and shows the last-saved time on every visit (to prove it survives closing, rebooting and a few days)
- [x] Shows whether persistent storage was requested and granted, and the storage estimate if available
- [x] Shows a per-profile marker (a random id created on first visit) so the two kid profiles can be compared for separate storage
- [x] Backup check: a button that downloads a small file
- [x] Restore check: a file picker that reads a chosen file and shows its contents
- [x] Outbound call check: a button that fetches a known public HTTPS address and reports success or failure (for V1.5)
- [x] A finger-drawing pad to judge smoothness
- [x] A web app manifest so add-to-home-screen can be tried and fullscreen launch checked; the page shows whether it's running standalone
- [x] Notes on the page how to connect remote debugging (adb + `chrome://inspect`)

## Comments

**2026-11-07 (agent):** Code done and checked in headless Edge at 1280×800. Every card renders. The IndexedDB visit record survives reloads. Restore reads a picked file. The outbound call returns 200 from `https://api.github.com/zen`, and its failure messages tell "blocked" apart from "no CORS". The drawing pad draws. The service worker registers, scoped to `night1/`. The page is `night1/index.html` + `src/night1/main.ts` + `public/night1/` (manifest, `sw.js`, icons), added as a second Vite build input. After pushing it will be at https://trevordobrinska.github.io/doodle-monsters/night1/.

Remaining human steps (on the Fire HD 8):
1. Push to `master` and wait for the Pages deploy.
2. Approve the `/night1/` URL in the Amazon Kids Parent Dashboard for both profiles.
3. Work through the cards. Checks the page can't detect for itself (the backup file landing in Downloads, the two profiles showing different markers, smooth drawing, fullscreen from the home screen icon, remote debugging) have Yes/No buttons that save your answer. "Forget my answer" clears it.
4. Come back after closing the app, after a reboot and after a few days: card 2 should list the earlier visits.

What to expect: on a first visit, card 2 is yellow ("come back later"). Card 3 is likely red ("Not granted"): the page asks for persistent storage on every load, and browsers often refuse until the site is installed or used a lot. That's a real result to record, not a broken page. When Night 1 is over, remove `night1/`, `src/night1/`, `public/night1/` and the `night1` input in `vite.config.ts`.
