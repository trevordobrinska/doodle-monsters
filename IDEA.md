/grill-me Doodle Monsters

Problem: My kids (7–10) love drawing and love games. Fighting a monster they drew themselves is a payoff no store-bought game gives them.
User: My kids, ages 7–10, playing on a phone or tablet. Me as the builder, using it to sharpen my coding skills.
MVP:
- Draw a monster with a finger on a touch canvas (a few colors, an undo button)
- Name it, then watch it come alive: wobble, squash and stretch, googly eyes
- It bounces around the screen, and kids tap or flick it to defeat it (a health bar and a goofy defeat animation)
- Defeated monsters get saved to a "monster zoo" gallery on the device
Out of scope:
- Accounts, online sharing, multiplayer
- Real frame-by-frame animation or rigging
- App store release; this is a home-screen web app
- Ads, purchases, polish for strangers
Later (if V1 is a hit):
- Monster battles: each kid's monsters take on their sibling's monsters
- A shared family Zoo synced across profiles and tablets (small backend, a skill stretch)
Constraints: Browser web app (HTML/JS, installable on the home screen), touch-first, works on iPad and phone Safari. Solo build, about 1 week of evenings and weekends. Built for fun and for learning; productivity doesn't matter.
Build vs buy: N/A. This is a fun build to sharpen coding skills and delight the kids, not a market play.
Open questions:
- Does a flat drawing feel alive with only simple motion, or does it need more (separated limbs, a face the game detects)?
- Plain canvas, or a small game library (e.g. Phaser, Kaboom/Kaplay)? Which teaches me more?
- How does the zoo save drawings locally (localStorage vs IndexedDB), and does Safari ever wipe them?
- What makes the fight fun for a 7-year-old and still fun for a 10-year-old (difficulty, monster "powers" based on drawing size or color)?
- Which skills do I want this build to stretch?
