# 13: Run Night 1 on the tablets

**What to build:** The builder runs the Night 1 test page (ticket 02) on both Fire HD 8 tablets in each kid's Amazon Kids profile and records the results here. The results decide how ticket 14 (storage and backup) and ticket 15 (install) are finished.

**Blocked by:** 02 (Night 1 test page), and the tablets being home.

**Status:** ready-for-human

- [x] The GitHub Pages address is approved in the Amazon Kids Parent Dashboard for both kids
- [x] The page loads in each Kids profile
- [ ] Add-to-home-screen works and opens fullscreen (no: not possible in a Kids profile)
- [ ] Saved data survives closing the app, rebooting and a few days (recheck after a few days). Reopening: yes. Reboot and few days: still to do
- [x] The two kid profiles have separate storage
- [ ] Backup download works (note if it asks for the parent passcode) and the Restore file picker works (no: both blocked)
- [x] Finger drawing is smooth
- [ ] Remote debugging from the PC works (adb + `chrome://inspect`) (skipped for now; do it if a tablet-only bug shows up)
- [x] (For V1.5) the page can call an outside server address from the Kids profile
- [x] Results written under `## Comments` below

## Comments

**2026-11-08 (builder, recorded by agent):** Run on both Fire HD 8s, each in its kid's Amazon Kids profile. `trevordobrinska.github.io` was already allowed for both kids in the Parent Dashboard. The page opened from the Arcade's "Doodle Monsters Night 1" Test Tile.

| Card | Tablet A | Tablet B |
|---|---|---|
| 1. Page loads | Pass | Pass |
| 2. Saved data survives | Pass: 6 visits kept, last at 8:52:41 pm | Yellow (first visit) |
| 3. Persistent storage | Not granted | Not granted |
| 4. Profile marker | `87D9B47A` | `B08CD1E7` (different: separate storage) |
| 5. Backup download | Fail: says "Started", but no prompt, no passcode request, no file | Not tried (same profile type) |
| 6. Restore file picker | Fail: the picker doesn't open | Not tried |
| 7. Outside server | Pass (200) | Pass (200) |
| 8. Finger drawing | Smooth | Smooth |
| 9. Home screen, fullscreen | Not possible: the Arcade's first tablet session found a Kids profile can't add to the home screen | Same |
| 10. Remote debugging | Skipped; adb is installed on the PC | Skipped |

What this decides:
- **Ticket 14:** files are blocked in Kids profiles, so take the "hide the buttons and record the server-backup follow-up" path. Storage isn't persistent, which makes that server backup matter more (V1.5; card 7 shows a Kids profile can reach an outside server).
- **Ticket 15:** there's no home-screen install from a Kids profile, so the game is reached through the Arcade as an allowed website. The Arcade's ticket 05 is reworking this.

Still open: close the app and reboot tablet B, then reopen card 2 on both tablets after a few days. Both should list earlier visits. Once that's recorded, this ticket can close and the Night 1 page can be removed (see ticket 02).
