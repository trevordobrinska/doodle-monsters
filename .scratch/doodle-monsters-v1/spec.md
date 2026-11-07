# Spec: Doodle Monsters V1

Status: ready-for-agent

Sources: `DESIGN.md` (the source of truth), `GLOSSARY.md`, `docs/adr/0001-plain-canvas-no-game-framework.md`. If `IDEA.md` disagrees with `DESIGN.md` (it still says "defeat" and "Safari"), `DESIGN.md` wins.

## Problem Statement

My two kids (ages 7 and 10) love drawing and love games, but no store-bought game lets them play with a creature they drew themselves. They each have a Fire HD 8 tablet with an Amazon Kids profile and nothing on it that turns their drawings into something alive. I also want a fun, low-stakes project to sharpen my coding skills, especially the game fundamentals: a game loop, motion, collision and touch gestures.

## Solution

Doodle Monsters is a touch-first browser game, hosted on GitHub Pages and installed on each kid's tablet home screen. A kid draws a Monster with a finger and brings it to life with Googly Eyes, a Temperament and a silly name. Then they Catch it by Bonking and Flicking it while it dashes around, until it's fully Dizzy and one last tap pops it into a bubble. Caught Monsters live in the kid's own Zoo. There they wander through Habitats, their Googly Eyes follow the kid's finger, and tapping one opens its Name Card with a generated Bio. A Catch can't fail, and Monsters are never hurt or destroyed. A Monster only leaves the Zoo when the kid chooses to Say Goodbye. Each Monster is drawn once and caught once. To play again, draw a new one.

## User Stories

### Opening the app and the Zoo
1. As a kid, I want the app to open straight into my Zoo, so that I see my Monsters right away without menus.
2. As a kid, I want a big "Draw a Monster!" button in my Zoo, so that starting a new Round is obvious.
3. As a kid with an empty Zoo, I want an arrow pointing at the "Draw a Monster!" button, so that I know what to do the first time.
4. As a kid, I want my caught Monsters to wander and bounce around their Habitat, so that my Zoo feels alive.
5. As a kid, I want my Monsters' Googly Eyes to follow my finger when I touch the screen, so that they feel like they're watching me.
6. As a kid, I want Googly Eyes to jiggle when a Monster moves, so that it looks goofy and alive.
7. As a kid with a big Zoo, I want my Monsters split across several Habitats that I can move between, so that the screen never gets too crowded.
8. As a kid, I want each Habitat to hold no more than about 10 Monsters, so that the game stays smooth on my tablet.
9. As a kid, I want to tap a Monster in my Zoo to open its Name Card, so that I can see its details.
10. As a kid, I want the Name Card to show my Monster's name, a large picture of it, the date I drew it, its Temperament and its Bio, so that I can remember who it is.
11. As a kid, I want to close the Name Card and go back to the Habitat, so that I can keep watching my Monsters.

### Say Goodbye
12. As a kid, I want a Say Goodbye button on the Name Card, so that I can choose to let a Monster leave my Zoo.
13. As a kid, I want Say Goodbye to need a press and hold, so that I don't lose a Monster by accident.
14. As a kid, I want a Monster to wave and walk away when I Say Goodbye, so that it's a gentle goodbye, not a deletion.
15. As a kid, I want Monsters to leave my Zoo only when I Say Goodbye, so that I never lose one any other way.

### Napping
16. As a kid who left in the middle of a Catch, I want that Monster to show up in my Zoo as Napping with a 💤, so that I know it's waiting for me.
17. As a kid, I want to tap a Napping Monster to go back to its Catch, so that I can finish catching it.
18. As a kid, I want a Napping Monster to keep its drawing, Googly Eyes, Temperament and name, so that nothing I made is lost.

### Drawing
19. As a kid, I want a full-screen drawing canvas, so that I have room for all the details I want.
20. As a kid, I want to draw smoothly with my finger, so that my lines look like what I meant.
21. As a kid, I want about 8 bright colors to choose from, so that my Monster can be colorful.
22. As a kid, I want a thick brush and a thin brush, so that I can fill big areas and draw small details.
23. As a kid, I want an undo button that removes my last stroke, so that I can fix mistakes.
24. As a kid, I want a start-over button, so that I can wipe the canvas and begin again.
25. As a kid, I want no timer while drawing, so that I can take as long as I like.
26. As a kid, I want the "Done" button to work only after I've drawn enough, so that I don't accidentally make a Monster out of a single dot.
27. As a kid, I want my drawing trimmed to just the ink with a see-through background, so that my Monster looks like a creature and not a picture in a box.
28. As a kid, I want every Monster resized to the same size whatever I drew, so that tiny or huge drawings don't make a Catch unfair.

### Bring it to life
29. As a kid, I want to stick 1 to 5 Googly Eyes anywhere on my drawing, so that my Monster can see.
30. As a kid, I want to move or remove a Googly Eye I've placed before I finish, so that I can get the face right.
31. As a kid, I want to pick my Monster's Temperament from a short list, so that I decide its personality.
32. As a kid, I want each Temperament explained simply (a word and an icon), so that I know what I'm choosing.
33. As a kid, I want my Monster to get a funny generated name, so that I don't have to think of one.
34. As a kid, I want a 🎲 button that rerolls the name, so that I can find one I like.
35. As a kid, I want to type my own name for the Monster, so that I can name it whatever I want.
36. As a kid, I want to start the Catch once my Monster has eyes, a Temperament and a name, so that the fun begins.

### Catch
37. As a kid, I want my Monster to come to life and move around the screen at the start of the Catch, so that it feels like my drawing is alive.
38. As a kid, I want a tap that lands on my moving Monster (a Bonk) to squash it with stars, so that every hit feels great.
39. As a kid, I want each Bonk to make my Monster more Dizzy, with a meter I can see, so that I know I'm making progress.
40. As a kid, I want my Monster to be Stunned for about a second after a Bonk, wobbling in place, so that I can enjoy the hit.
41. As a kid, I want taps on a Stunned Monster to just go "boing" with no penalty, so that I learn to wait without being punished.
42. As a parent, I want the Stunned window to make extra taps do nothing, so that the kids can't win by tapping as fast as they can.
43. As a kid, I want my Monster to dash off faster in a random direction after being Stunned, so that catching it stays a challenge.
44. As a kid, I want a quick swipe across my moving Monster (a Flick) to fling it into a wall, so that I have a bigger, more exciting move.
45. As a kid, I want a Flick to count as two Bonks, so that a good swipe is worth the extra skill.
46. As a kid, I want my Monster's Dizzy to fade if I go a few seconds without a Bonk, so that I have to keep at it.
47. As a kid, I want my Monster to get spiral eyes when it's fully Dizzy, so that I know it's ready to be caught.
48. As a kid, I want one last tap on a fully Dizzy Monster to catch it in a bubble, so that the Catch ends with a satisfying moment.
49. As a kid, I want a missed tap to do nothing bad, so that missing isn't frustrating.
50. As a kid, I want my Monster's Temperament to change how it moves during the Catch, so that different Monsters feel different.
51. As my 10-year-old, I want a hard mode toggle that tightens everything, so that Catches still challenge me.
52. As my 7-year-old, I want the normal mode to be easy enough that I catch my Monster in about 30–60 seconds, so that I always get there.
53. As a kid who's struggling, I want my Monster to get sleepy and slow down after about 2 minutes, so that I can always finish the Catch.
54. As a kid, I want a Catch to never fail, so that I never lose a Monster I drew.
55. As a kid, I want to leave in the middle of a Catch without losing my Monster, so that I can stop when I need to and finish later.
56. As a kid, I want my caught Monster to move into my Zoo Habitat, so that I see it join the others and the Round feels complete.
57. As a kid, I want each Monster caught exactly once, with no re-catching, so that every Monster I draw is special.

### Bio
58. As a kid, I want my Monster to get a short, silly Bio, so that it has a personality story.
59. As a kid, I want the Bio to mention real things about my Monster (how many eyes it has, its main color, its Temperament), so that it feels written about my Monster.
60. As a kid, I want the Bio to work without internet, so that it never breaks.

### Sound
61. As a kid, I want fun sound effects for Bonks, boings, Flicks, wall hits and the bubble catch, so that the game feels lively.
62. As a kid, I want each Monster's sounds pitched a little differently, so that every Monster has its own voice.

### Saving and backup
63. As a kid, I want my Zoo saved on my tablet automatically, so that my Monsters are still there tomorrow.
64. As a kid, I want my Zoo to survive closing the app and restarting the tablet, so that I never lose my Monsters.
65. As a sibling, I want my Zoo kept separate from my brother's or sister's, so that my Monsters are mine.
66. As a kid, I want a Backup button that saves my whole Zoo to a file, so that I have a safe copy.
67. As a kid, I want a Restore button that loads my Zoo from a backup file, so that I can get my Monsters back.
68. As a parent, I want Backup and Restore to work without a parent gate if the Kids profile allows it, so that I'm not needed every time.
69. As the builder, I want each Monster saved in a format that could sync to a server later, so that a shared family Zoo is possible without redoing the data.

### Platform and builder
70. As a parent, I want the game hosted at an HTTPS address I can approve in the Amazon Kids Parent Dashboard, so that the kids can open it in their profiles.
71. As a kid, I want to open the game from an icon on my home screen in fullscreen, so that it feels like a real app.
72. As a kid, I want the game to run smoothly on my Fire HD 8, so that drawing and catching feel good.
73. As the builder, I want a throwaway Night 1 test page published ahead of time, so that I can check what the Kids profile allows the moment the tablets come back.
74. As the builder, I want the game's rules kept separate from drawing and touch code, so that I can test them and change the look without breaking the rules.
75. As the builder, I want to write my own game loop, motion, collision and gesture code on a plain canvas, so that I learn the fundamentals (ADR 0001).
76. As the builder, I want to develop in desktop Chrome's device toolbar (1280×800, touch, CPU throttling), so that I can build while the tablets are away.
77. As the builder, I want to debug on the real tablet over adb with `chrome://inspect`, so that I can fix device-only problems.
78. As the builder, I want pushes to publish to GitHub Pages, so that the kids always have the latest version.

## Implementation Decisions

- **Stack:** TypeScript + Vite, Vitest for tests, hosted on GitHub Pages. Plain `<canvas>` with a hand-written game loop, motion, collision and touch-gesture code. No game framework (ADR 0001: don't add one unless the learning goal changes).
- **Target:** Fire HD 8 (10th gen, 2 GB RAM, 1280×800), Silk browser, Amazon Kids profiles. One tablet and one profile per kid. Design for landscape at 1280×800, touch-first.
- **Modules:**
  - **Game core:** pure TypeScript with no DOM or canvas. It owns the Round as a state machine (Zoo → Draw → Bring to life → Catch → Zoo), the Catch rules (Bonk, Flick, Stunned, Dizzy and its draining, spiral-eyes readiness, the final catching tap, the sleepy slowdown after about 2 minutes), the Temperament behavior table, the hard mode adjustments, Monster motion and wall collision inside an arena of known size, Habitat wandering and splitting, Napping and resume, Say Goodbye, and the name and Bio generators. It's deep: a small interface hides all of the rules.
  - **Core interface (shape):** the core takes Round events (finish drawing with ink facts such as size, main color and ink amount; place, move or remove a Googly Eye; pick a Temperament; reroll or set the name; start the Catch; Bonk at a point; Flick along a path; leave; resume a Napping Monster; Say Goodbye; set hard mode). It also takes `tick(dt)` to advance time. You can ask it for the current phase, the Monster's position, speed and pose, Dizzy level, whether it's Stunned or caught, the Zoo, its Habitats and Napping Monsters, and each Monster's name, Bio and date drawn. A clock and dice (random source) are passed in, so the core is fully deterministic.
  - **Gesture interpretation:** the rendering layer turns raw pointer events into Bonk (tap) and Flick (quick swipe whose path crosses the Monster) events for the core. The thresholds that separate a tap from a Flick belong to this layer. Hit-testing against the Monster's position is done by the core.
  - **Drawing canvas:** strokes with color and brush size, an undo stack of strokes, start over, an ink-amount measure for the "Done" gate, and the final processing: trim to the ink, transparent background, resize so every Monster is the same size, and work out the main color. Images stay a modest size.
  - **Renderer:** draws the Habitat, Catch, Name Card and drawing screens from the core's state. It handles squash and stretch, stars, wobble, spiral eyes, jiggling Googly Eyes that follow the finger, the bubble, the wave-and-walk-away, and the 💤 badge. It holds no game rules.
  - **Zoo storage:** a small interface (save a Monster, list Monsters, remove a Monster, plus export and import of the whole Zoo for Backup and Restore). All saving goes through it. The real version uses IndexedDB on the device, and tests use an in-memory version. Finalizing it, including asking for persistent storage, waits for the Night 1 results.
  - **Sound:** Kenney.nl CC0 effects played with a pitch shift chosen per Monster. No music.
- **Monster record (sync-ready):** a stable unique id; name; trimmed drawing image; Googly Eye positions (1–5, relative to the image); Temperament; Bio; main color; date drawn; status (Napping or in the Zoo); and a schema version. Store it as plain data a server could accept later, with nothing tied to the device besides the image blob.
- **Temperaments:** start with something like Speedy, Sneaky, Bouncy, Sturdy and Sleepy. Each one is a set of numbers for the core (base speed, dash boost, Stunned length, Dizzy drain rate, wandering style) and feeds the Bio. The exact list and values get tuned while building. Hard mode applies one tightening to every Temperament.
- **Tuning starting points (to be adjusted by playtest):** Stunned lasts about 1 s. A Flick counts as 2 Dizzy steps. Dizzy starts draining after a few seconds without a Bonk. A normal Catch should take about 30–60 s. The sleepy slowdown kicks in at about 2 min.
- **Name and Bio generators:** fill in the blanks from word lists, choosing words with the dice that's passed in. The Bio template uses the number of Googly Eyes, the main color and the Temperament. The word lists are kid-safe, live in data, and the family will expand them later.
- **Draw once, catch once:** a caught Monster can't be caught again. Each Catch belongs to exactly one Monster.
- **Leaving a Catch:** if the app is hidden, closed or navigated away from mid-Catch, the Monster is saved as Napping. Resuming it restores the Catch (Dizzy can start fresh). A Catch never ends in failure.
- **Backup and Restore:** buttons anyone can press (no parent gate) to export the Zoo as a file and import it again. Whether a file can be downloaded or picked in a Kids profile is a Night 1 check. If it's blocked, the backup moves to a server (out of scope here).
- **Build order:** (1) scaffold Vite + TS + Vitest, publish to GitHub Pages, and build the Night 1 test page; (2) drawing canvas, Googly Eyes, Catch rules (test-first) and Habitat, developed in desktop Chrome's device toolbar, with saving behind the storage interface; (3) once the tablets are back, the Night 1 test, finalizing storage and backup, and on-device feel checks. Work that depends on Night 1 is blocked until it runs.

## Testing Decisions

- **One seam: the game core.** Tests drive it only through its public interface: Round events plus `tick(dt)`, with a fake clock, a seeded dice and an in-memory Zoo storage. They then check the state it reports. No canvas, DOM or rendering in tests.
- **What makes a good test:** it checks behavior a kid would notice, in glossary terms. For example: "a Bonk adds a step of Dizzy," "taps while Stunned don't add Dizzy," "a Flick adds two steps," "Dizzy drains after a few seconds without a Bonk," "a fully Dizzy Monster is caught by one more tap," "a Monster gets sleepy and slows after about 2 minutes," "leaving a Catch leaves the Monster Napping in the Zoo, and resuming returns to the Catch," "a caught Monster appears in the Zoo and is still there after reloading from storage," "Say Goodbye removes the Monster from the Zoo," "a Zoo with more than about 10 Monsters is split into several Habitats," "a Speedy Monster moves faster than a Sleepy one," "hard mode makes a Catch harder," "the same dice gives the same name and Bio," "the Bio mentions the eye count, main color and Temperament." Don't test internals such as private fields, the order of calls or exact tuning numbers, unless the number is a design rule like "Flick = 2 steps."
- **Tested modules:** only the game core, including the Temperament rules, hard mode, and the name and Bio generators reached through it.
- **Not unit-tested:** the IndexedDB storage version and Backup and Restore files (checked on Night 1 and on the device), the drawing canvas and ink processing, gesture thresholds, rendering, sound, and the overall feel. These get playtested by eye in Chrome's device toolbar and then on the Fire HD 8.
- **Prior art:** none yet (greenfield). The first core tests set the pattern: a small test helper that builds a core with a fake clock, a seeded dice and in-memory storage, then a sequence of events and ticks.

## Out of Scope

- Accounts, online sharing, multiplayer of any kind
- Monster battles between siblings (later, if V1 is a hit)
- A shared family Zoo synced across profiles and tablets, and any backend or Cloudflare Worker (later). The data format is ready for it, but no sync is built.
- AI Bio via Claude (V1.5). V1 ships only the offline fill-in-the-blanks Bio.
- A server-side backup (only needed if Night 1 shows file Backup or Restore is blocked)
- Frame-by-frame animation, rigging, separated limbs, face detection, mesh warping
- Re-catching or releasing a caught Monster
- An eraser, timers on drawing, music
- App store release, ads, purchases, polish for strangers
- Support beyond the two Fire HD 8 tablets (other devices may happen to work but aren't targets)

## Further Notes

- Use the glossary vocabulary throughout: code, tests and UI text say Catch, Bonk, Flick, Stunned, Dizzy, Napping, Say Goodbye, Zoo and Habitat, never defeat, kill, enemy, delete or gallery.
- Still open, to decide while building: the exact Temperament list and behaviors, and the name and Bio word lists (a family evening project).
- The Night 1 checklist in `DESIGN.md` covers: page loads in the Kids profile; add-to-home-screen opens fullscreen; data survives closing, rebooting and a few days; the two profiles have separate storage; backup download and Restore file picker work; finger drawing is smooth; adb remote debugging works; outbound server calls work (for V1.5). Its results may change the storage and backup tickets.
- As of 2026-11-07 the tablets are away for a couple of days. Everything except Night 1 and finalizing storage can proceed in desktop Chrome first.
