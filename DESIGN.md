# Doodle Monsters: Design (grilled 2026-11-07)

The pitch is in `IDEA.md` and the vocabulary is in `GLOSSARY.md`. This file records what was decided and why.

## Goal
Fun for the kids (7 and 10) and a way to sharpen my coding skills. Productivity doesn't matter.

## Platform
- **Devices:** two Fire HD 8 tablets (10th gen, 2020: 2 GB RAM, 1280×800), one per kid. Each kid uses their own Amazon Kids profile. Design for **one tablet and one profile per kid**.
- **Browser:** Silk, which is based on Chromium. The game is a web app, installed on the home screen if Silk allows it.
- **Hosting:** GitHub Pages (free, HTTPS). Approve the address in the Amazon Kids Parent Dashboard.
- **Stack:** TypeScript + Vite, drawing on a plain `<canvas>` with my own game loop. **No game framework**, on purpose: the fundamentals are what I want to learn.
- **Tests:** Vitest for the game's rules (Dizzy meter, Stunned window, Temperaments, name and Bio generators, Zoo save/load). Feel and drawing get playtested by eye on the tablet. Keep the rules separate from the drawing code.
- **Performance:** keep it light. Monster images stay a modest size, and about 10 Monsters max per Habitat.

## Build order (updated 2026-11-07: the tablets are away for a few days)
There's no faithful way to emulate a Fire tablet in a Kids profile, so the tablet test waits until the tablets are back. Meanwhile:
1. Set up Vite + TS + Vitest, get it publishing to GitHub Pages, and build the Night 1 test page ahead of time.
2. Build the drawing canvas, Googly Eyes, Catch rules (with tests) and Habitat, testing in desktop Chrome's device toolbar (1280×800, touch, CPU throttle). Put all Zoo saving behind one small storage piece of code.
3. When the tablets are back: run the Night 1 test, finalize storage and backup, and check the feel on the real device.

## Night 1: test on the real tablet
Throwaway page → GitHub Pages → approve in Parent Dashboard → check on an HD 8 in a kid's profile:
Run 2026-11-08 on both tablets; full results in ticket 13.
- [x] Page loads in the Kids profile
- [x] Add-to-home-screen works and opens fullscreen. A site on the Parent Dashboard's allowed list shows up as an icon in the kid's **My Stuff** folder on the home screen and opens fullscreen (no address bar or browser controls). There's no manual add-to-home-screen step
- [ ] Saved data survives closing the app, rebooting and a few days. Survives reopening (6 visits kept); reboot and few-days recheck still to do. Persistent storage is **not granted**
- [x] The two kid profiles have separate storage
- [ ] Downloading a backup file works (or asks for the parent passcode?), and a file picker works for Restore. **No:** nothing downloads (no prompt) and the file picker doesn't open
- [x] Finger drawing is smooth
- [ ] Remote debugging from the PC works (adb + `chrome://inspect`). Skipped for now; adb is installed on the PC
- [x] (For the V1.5 bio) The page can call an outside server address from the Kids profile

## The Round
1. **Open the app:** it goes straight to the kid's Zoo Habitat with a big "Draw a Monster!" button. A Napping Monster shows 💤 and can be tapped to resume. An empty Zoo shows an arrow pointing at the button.
2. **Draw:** full-screen canvas, about 8 bright colors, thick and thin brushes, undo, start over. No eraser, no timer. A minimum amount of ink is required before "Done."
3. **Bring it to life:** stick on 1 to 5 Googly Eyes, pick a **Temperament** from a list, and get a generated name (🎲 reroll, editable). The drawing is trimmed to its ink with a transparent background and **resized so every Monster is the same size**.
4. **Catch** (about 30–60 seconds):
   - A **Bonk** squashes it with stars and adds a step of Dizzy.
   - Then it's **Stunned** for about 1 second and immune ("boing," no penalty).
   - Then it **dashes** off faster in a random direction.
   - Dizzy drains if it goes a few seconds without a Bonk.
   - A **Flick** across a moving Monster flings it into a wall and counts as 2 steps.
   - At full Dizzy it gets spiral eyes, and one last tap catches it in a bubble.
   - The Temperament shapes its behavior. A hard mode toggle tightens everything.
   - **Tricks (added 2026-11-08, spec in `.scratch/catch-tricks/`):** each Temperament has a signature Trick. Speedy leaves an After-image, Sneaky Fades, Bouncy Dodges, Shy (formerly Sturdy) curls into its Shell, and Sleepy Dozes. Tricks start after 2 Bonks and come more often as Dizzy builds. They come sooner and more often in hard mode, and stop once the Monster is sleepy. Being fooled only goes "boing." Kids discover Tricks on their own, with no descriptions.
   - **A Catch can't fail.** If the kid leaves, the Monster naps and the Catch resumes later. After about 2 minutes it gets sleepy and slows down.
5. **Zoo:** the Monster moves into its Habitat. Monsters wander and bounce, and their Googly Eyes follow your finger. Tap one for its **Name Card** (name, large picture, date drawn, Temperament, Bio, Say Goodbye).

**Draw once, catch once.** No re-catching. To play again, draw a new Monster.

## Data
- Each kid's Zoo lives only on their device (IndexedDB is likely). Store each Monster's data so it could sync to a server later.
- **Backup/Restore:** buttons anyone can use (no parent gate) that save and load a file. This depends on what the Night 1 test shows for Kids profiles. If it's blocked, the backup moves to the server below. Night 1 showed it's blocked, so V1 hides the buttons and backup waits for the server.

## Sound
Our own synthesised sound effects (made by `scripts/make-sounds.py`), with the pitch changed in code for each Monster. No music in V1. We first planned Kenney.nl CC0 effects, but the synthesised stand-ins playtested well, so they're kept for V1.

## Bio
- **V1:** a fill-in-the-blanks generator that uses real facts about the drawing (number of eyes, main color, Temperament). Works offline.
- **V1.5:** an AI Bio. Claude looks at the drawing and writes a kid-safe Bio. Calls go through a small Cloudflare Worker, because the API key can't be in the public GitHub Pages code. It costs well under a cent per Bio. Drawings get sent to Anthropic. If there's no internet, it falls back to the V1 generator.

## Later (if V1 is a hit)
- Monster battles between siblings
- A family Zoo shared across profiles and tablets, using the same Worker
- Mesh warping (jelly bending) for more lifelike motion

## Still open (small; decide while building)
- The exact Temperament list and what each one does (now Speedy, Sneaky, Bouncy, Shy, Sleepy)
- The word lists for names and Bios (a family evening project)
