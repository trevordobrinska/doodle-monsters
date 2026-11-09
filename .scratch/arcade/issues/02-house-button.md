# 02: House button back to the Arcade

**What to build:** The Game's source has no link to the site root `/`, so the kids can only leave it with the tablet's Back. Add a small house button to the Game's home screen (the Zoo, `#zoo` in `index.html`) that links to the Arcade at `/` (suite rule 5 in `C:\Users\trevo\Projects\arcade\SUITE-RULES.md`), e.g. `<a href="/">`. The tablet's own Back is the backup. Found by the Arcade's Ready check sweep on 2026-11-08 ("link home" failed).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The Zoo shows a small house button, always in the same spot, inside the Habitat and clear of the Draw button and Habitat arrows
- [ ] It links to the site root `/` (absolute, so it leaves `/doodle-monsters/`), opening in the same window so the Arcade's fullscreen window stays put
- [ ] The Arcade's Ready check (`node tools/ready-check.js doodle-monsters`, run from the Arcade repo) shows "link home" passing
- [ ] Checked on the tablet: the house button and system Back both return to the Arcade, still fullscreen
