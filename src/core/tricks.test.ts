import { describe, expect, it } from "vitest";
import type { GameCore } from "./gameCore";
import { buildCore, runFor, runUntil, swipeAcross, tapMonster, type CatchOptions } from "./testing";

const catchWith = (options: CatchOptions) => buildCore(1, undefined, options);

/**
 * Keeps the Monster's Dizzy topped up to `level` for `seconds`: whenever it
 * has drained below, the kid Bonks it again. Returns the share of the time
 * (0 to 1) it spent playing its Trick.
 */
function trickTimeAt(core: GameCore, level: number, seconds: number): number {
  let frames = 0;
  let tricking = 0;
  runFor(core, seconds, () => {
    frames++;
    const m = core.monster();
    if (m.trick) tricking++;
    if (m.dizzy < level && !m.stunned && !m.flying && !m.trick) tapMonster(core);
  });
  return tricking / frames;
}

describe("Tricks", () => {
  it("a nearly Dizzy Sneaky Monster Fades", () => {
    const core = catchWith({ temperament: "sneaky" });

    expect(trickTimeAt(core, 5, 100)).toBeGreaterThan(0);
  });

  it("a Monster plays no Trick before its first 2 Bonks", () => {
    const core = catchWith({ temperament: "sneaky" });

    expect(trickTimeAt(core, 1, 100)).toBe(0);
  });

  it("a nearly Dizzy Monster plays its Trick more often than one just past 2 Bonks", () => {
    const nearlyDizzy = trickTimeAt(catchWith({ temperament: "sneaky" }), 5, 100);
    const justPast2Bonks = trickTimeAt(catchWith({ temperament: "sneaky" }), 2, 100);

    expect(justPast2Bonks).toBeGreaterThan(0);
    expect(nearlyDizzy).toBeGreaterThan(justPast2Bonks * 1.5);
  });

  it("a Flick counts as 2 Bonks towards Tricks", () => {
    const core = catchWith({ temperament: "sneaky" });
    let tricked = false;
    runFor(core, 100, () => {
      const m = core.monster();
      if (m.trick) tricked = true;
      if (m.dizzy === 0 && !m.stunned && !m.flying) core.flick(swipeAcross(core));
    });

    expect(tricked).toBe(true);
  });

  it("hard mode plays Tricks more often", () => {
    const normal = trickTimeAt(catchWith({ temperament: "sneaky" }), 3, 100);
    const hard = trickTimeAt(catchWith({ temperament: "sneaky", hardMode: true }), 3, 100);

    expect(hard).toBeGreaterThan(normal * 1.2);
  });

  it("hard mode starts Tricks sooner", () => {
    const normal = trickTimeAt(catchWith({ temperament: "sneaky" }), 1, 100);
    const hard = trickTimeAt(catchWith({ temperament: "sneaky", hardMode: true }), 1, 100);

    expect(normal).toBe(0);
    expect(hard).toBeGreaterThan(0);
  });

  it("a sleepy Monster plays no Trick", () => {
    const core = catchWith({ temperament: "sneaky" });
    runUntil(core, () => core.monster().sleepy);

    expect(trickTimeAt(core, 5, 60)).toBe(0);
  });

  it("Monsters with other Temperaments play no Trick yet", () => {
    for (const temperament of ["speedy", "sturdy", "sleepy"] as const) {
      expect(trickTimeAt(catchWith({ temperament }), 5, 100)).toBe(0);
    }
  });
});

describe("Fade", () => {
  /** Waits until the Sneaky Monster is faintest during a Fade, and free to be Bonked. */
  function fadedSneaky(): GameCore {
    const core = catchWith({ temperament: "sneaky" });
    for (let i = 0; i < 5; i++) {
      runUntil(core, () => !core.monster().stunned);
      expect(tapMonster(core)).toBe("bonk");
    }
    runUntil(core, () => {
      const m = core.monster();
      return m.trick?.trick === "fade" && m.trick.opacity < 0.5 && !m.stunned;
    });
    return core;
  }

  it("a Sneaky Monster goes almost, but not fully, invisible for about a second", () => {
    const core = catchWith({ temperament: "sneaky" });
    for (let i = 0; i < 5; i++) {
      runUntil(core, () => !core.monster().stunned);
      tapMonster(core);
    }
    runUntil(core, () => core.monster().trick !== undefined);
    let seconds = 0;
    let faintest = 1;
    runUntil(core, () => {
      const trick = core.monster().trick;
      if (trick?.trick !== "fade") return true;
      seconds += 1 / 60;
      faintest = Math.min(faintest, trick.opacity);
      return false;
    });

    expect(seconds).toBeGreaterThan(0.6);
    expect(seconds).toBeLessThan(1.6);
    expect(faintest).toBeGreaterThan(0);
    expect(faintest).toBeLessThan(0.3);
  });

  it("a faded Sneaky Monster can still be Bonked", () => {
    const core = fadedSneaky();
    const before = core.monster().dizzy;

    expect(tapMonster(core)).toBe("bonk");
    expect(core.monster().dizzy).toBe(before + 1);
  });

  it("a faded Sneaky Monster can still be Flicked", () => {
    const core = fadedSneaky();
    // Let some Dizzy drain, so the Flick adds Dizzy rather than catching it.
    runUntil(core, () => core.monster().dizzy <= 3, 60);
    runUntil(core, () => {
      const trick = core.monster().trick;
      return trick?.trick === "fade" && trick.opacity < 0.5;
    });

    expect(core.flick(swipeAcross(core))).toBe("flick");
  });
});

describe("Dodge", () => {
  /** Waits until the Bouncy Monster, nearly fully Dizzy, is ready to Dodge and free to be Bonked. */
  function dodgyBouncy(seed = 1, hardMode = false): GameCore {
    const core = buildCore(seed, undefined, { temperament: "bouncy", hardMode });
    for (let i = 0; i < 5; i++) {
      runUntil(core, () => !core.monster().stunned);
      expect(tapMonster(core)).toBe("bonk");
    }
    runUntil(core, () => core.monster().trick?.trick === "dodge" && !core.monster().stunned);
    return core;
  }

  it("a dodging Bouncy Monster turns a tap into a boing", () => {
    const core = dodgyBouncy();
    const before = core.monster().dizzy;

    expect(tapMonster(core)).toBe("boing");
    expect(core.monster().dizzy).toBe(before);
    expect(core.monster().stunned).toBe(false);
  });

  it("a dodging Bouncy Monster hops sideways, out from under the finger, quickly but visibly", () => {
    const core = dodgyBouncy();
    const finger = { x: core.monster().x, y: core.monster().y };
    core.bonk(finger);
    let seconds = 0;
    let highest = 0;
    runUntil(core, () => {
      const trick = core.monster().trick;
      const lift = trick?.trick === "dodge" ? trick.lift : 0;
      highest = Math.max(highest, lift);
      if (seconds > 0 && lift === 0) return true;
      seconds += 1 / 60;
      return false;
    });
    const m = core.monster();

    expect(seconds).toBeGreaterThan(0.15);
    expect(seconds).toBeLessThan(0.5);
    expect(highest).toBeGreaterThan(m.height * 0.2);
    expect(Math.abs(m.x - finger.x)).toBeGreaterThan(m.width * 0.6);
    expect(Math.abs(m.y - finger.y)).toBeLessThan(m.height * 0.1);
  });

  it("a Bouncy Monster never dodges twice in a row", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const core = dodgyBouncy(seed, true);
      expect(tapMonster(core)).toBe("boing");
      // Long enough for another Dodge to come round, if it could.
      runFor(core, 3);

      expect(tapMonster(core)).toBe("bonk");
    }
  });

  it("a Bouncy Monster never dodges a Flick", () => {
    const core = dodgyBouncy();

    expect(core.flick(swipeAcross(core))).toBe("flick");
    // And it doesn't hop out of the way of the taps that follow, mid-flight.
    expect(core.monster().trick).toBeUndefined();
  });

  it("a fully Dizzy Bouncy Monster doesn't dodge, so the catching tap always works", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const core = buildCore(seed, undefined, { temperament: "bouncy", hardMode: true });
      while (!core.monster().readyToCatch) {
        runUntil(core, () => !core.monster().stunned && !core.monster().flying);
        tapMonster(core);
      }
      let tricked = false;
      runFor(core, 20, () => {
        if (core.monster().trick) tricked = true;
      });

      expect(tricked).toBe(false);
      expect(tapMonster(core)).toBe("caught");
    }
  });
});
