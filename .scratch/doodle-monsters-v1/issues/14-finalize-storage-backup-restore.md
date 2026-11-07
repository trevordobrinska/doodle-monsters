# 14: Finalize storage, Backup and Restore

**What to build:** Based on the Night 1 results, the kid's Zoo is saved reliably on their tablet, and Backup and Restore buttons anyone can press (no parent gate) save the whole Zoo to a file and load it back. If Night 1 shows files are blocked in Kids profiles, this ticket instead records the server-backup follow-up for later and hides the buttons.

**Blocked by:** 09 (Zoo), 13 (Run Night 1).

**Status:** ready-for-agent

- [ ] The IndexedDB storage version is hardened per the Night 1 results (e.g. requests persistent storage if that helps)
- [ ] Backup exports the whole Zoo (including images) to a single file through the storage interface
- [ ] Restore imports that file and brings every Monster back, including Napping ones
- [ ] Restoring a bad or empty file doesn't wipe the existing Zoo
- [ ] Core/storage-interface tests (in-memory) for "export then import gives the same Zoo"
- [ ] Checked on a Fire HD 8 in a Kids profile; if blocked, a follow-up note is written in the spec's Further Notes instead
