# Spec: Catch Tricks

Status: ready-for-agent

Sources: a grilling session on 2026-11-08, `DESIGN.md`, `GLOSSARY.md` (see **Trick**). Tickets are in `issues/`.

**Part of V1 (decided 2026-11-08):** build the Tricks now, before the game is installed on the tablets, so there's one stable version to install. Numbers get tuned afterwards, with the kids, in V1 ticket 15.

## Problem

The builder played a normal-mode Catch on an iPad with one Temperament. It was too easy (Monsters are easy to tap), too short (6 Bonks and done) and the same all the way through (every Bonk feels alike). The kids may get bored once the novelty wears off.

These are two separate problems:
- **Too easy:** the numbers inside one Catch. Tune these on the tablets with the kids (V1 ticket 15).
- **Boring:** variety across many Rounds. Tricks are the answer to this one.

## Rules that stay the same

A Catch can't fail, a Monster is never hurt, and each Monster is drawn once and caught once. No score, best time or stars. The builder is open to changing these in a V2 or a different game, but not now (to avoid scope creep).

## Decisions

- **One Trick per Temperament**, its signature move during a Catch. Starting points, with details tuned by playtest:
  - ⚡ **Speedy (After-image):** while dashing it leaves a fake copy behind for a moment. Tapping the fake goes "boing."
  - 🤫 **Sneaky (Fade):** now and then it goes almost invisible for about a second. It can still be Bonked if the kid keeps track of it.
  - 🦘 **Bouncy (Dodge):** sometimes it hops sideways just as a finger lands.
  - 🙈 **Shy (Shell):** now and then it curls up for a moment. Taps go "boing" while it's curled, but a Flick still knocks it into the wall. Outside those moments, plain Bonks work as normal.
  - 😴 **Sleepy (Doze):** it stops and dozes. The first tap only wakes it with a yawn. Then it runs off and the next tap counts as a Bonk.
- **Sturdy is renamed Shy 🙈**, because kids may not know "sturdy." Only the name and icon kids see change. The stored value stays `sturdy`, so Monsters already in the Zoos keep working. Bios and Name Cards show the new name.
- **Getting fooled costs nothing.** Tapping a fake, a dodging, curled or dozing Monster goes "boing," like tapping a Stunned one. A Trick never takes away Dizzy. The only cost is time, while the usual Dizzy drain keeps going.
- **It gets harder during a Catch.** No Tricks for the first 2 Bonks. After that the Monster uses its Trick more and more often until it's fully Dizzy. It's hardest around the final tap.
- **Hard mode** makes Tricks start sooner and happen more often. The Tricks themselves stay the same.
- **Tricks stop once the Monster gets sleepy** (after about 2 minutes), so "a Catch can't fail" stays true in practice.
- **No hints in the UI.** The Temperament picker stays a word and an icon. Kids discover Tricks on their own.

## Later (decide after the kids have played)

- **Hints in the Zoo:** Zoo Monsters now and then show off their Trick while wandering, just for looks.
- **Tuning "too easy":** Bonks needed, speed, Stunned length and the hit area, based on watching both kids.
- **Zoo play:** more things to do in the Zoo than watch Monsters wander.
- **A score or personal best:** only if hard mode plus Tricks still don't challenge the 10-year-old.
- **V2 rule changes:** losing, timers, re-catching, or a separate game.
- **Tricks based on the drawing**, such as eye count or main color, as an extra layer on top of Temperament Tricks.

## Comments

**2026-11-08 (close-out):** Decision: merge `catch-tricks` into `master` now, before the ticket 07 playtest.
