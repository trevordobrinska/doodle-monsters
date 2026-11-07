# 01: Walking skeleton: a blob bounces on GitHub Pages

**What to build:** The thinnest end-to-end path through the whole stack. Opening the GitHub Pages address shows a full-screen canvas with a placeholder blob bouncing off the walls, driven by the game core through a hand-written game loop. This sets the pattern every later ticket follows: rules in a pure game core, rendering separate, tests through the core's interface (see spec: Implementation Decisions, Testing Decisions; ADR 0001).

**Blocked by:** None (can start immediately).

**Status:** ready-for-human

- [ ] Vite + TypeScript + Vitest project scaffold; `npm test` and `npm run build` both work
- [ ] Game core is pure TypeScript (no DOM/canvas), takes an injected clock and dice, advances with `tick(dt)`, and reports the blob's position
- [ ] Blob moves and bounces off the walls of an arena of known size (1280×800 landscape target)
- [ ] Renderer draws the core's state on a plain `<canvas>` with a `requestAnimationFrame` loop; no game framework
- [ ] A test helper builds a core with a fake clock and seeded dice; at least one test proves wall bouncing through the core's interface
- [ ] Pushing to the main branch publishes to GitHub Pages over HTTPS (the human creates/approves the GitHub repo and enables Pages; the agent must not create remotes or push without asking)
- [ ] Looks right in desktop Chrome's device toolbar at 1280×800 with touch emulation

## Comments

**2026-11-07 (agent):** Code done: scaffold, pure game core with injected clock/dice, bouncing blob, canvas renderer + rAF loop, test helper and 2 core tests, Pages workflow (`.github/workflows/deploy.yml`, triggers on `main` or `master`). Remaining human steps: create the GitHub repo, add the remote and push, set Pages source to "GitHub Actions", then check the site at 1280×800 with touch emulation in Chrome's device toolbar. "blob" naming is a deliberate placeholder; rename to Monster when ticket 03 lands.
