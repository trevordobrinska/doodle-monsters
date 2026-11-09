# 01: Publish a Tile icon at /doodle-monsters/icon-512.png

**What to build:** The Arcade loads each Game's Tile picture from `/doodle-monsters/icon-512.png`, but the live site answers 404, so the Doodle Monsters Tile shows a name only. Add a square 512×512 PNG at `public/icon-512.png` so Vite copies it into the build and it's published at that path, and the kids can find the Game without reading (suite rule 4 in `C:\Users\trevo\Projects\arcade\SUITE-RULES.md`). Found by the Arcade's Ready check sweep on 2026-11-08 ("icon loads" failed).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] https://trevordobrinska.github.io/doodle-monsters/icon-512.png loads (200) after deploying
- [ ] It is a PNG of exactly 512×512
- [ ] The Doodle Monsters Tile in the Arcade shows the picture
