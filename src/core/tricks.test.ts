import { describe, expect, it } from "vitest";
import type { GameCore } from "./gameCore";
import { buildCore, runFor, runUntil, speedOf, swipeAcross, tapMonster, type CatchOptions } from "./testing";

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
    for (const temperament of ["speedy", "bouncy", "sturdy"] as const) {
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

describe("Doze", () => {
  /** Keeps a Sleepy Monster nearly Dizzy until it's dozing, and not Stunned. */
  function dozingSleepy(): GameCore {
    const core = catchWith({ temperament: "sleepy" });
    runUntil(core, () => {
      const m = core.monster();
      if (m.trick?.trick === "doze") return !m.stunned;
      if (m.dizzy < 5 && !m.stunned) expect(tapMonster(core)).toBe("bonk");
      return false;
    });
    return core;
  }

  it("a dozing Monster stands still", () => {
    const core = dozingSleepy();
    const { x, y } = core.monster();
    runFor(core, 0.5);

    expect(speedOf(core)).toBe(0);
    expect(core.monster()).toMatchObject({ x, y });
  });

  it("a tap on a dozing Monster wakes it without adding Dizzy", () => {
    const core = dozingSleepy();
    const before = core.monster().dizzy;

    expect(tapMonster(core)).toBe("boing");
    expect(core.monster().dizzy).toBe(before);
    expect(core.monster().stunned).toBe(false);
    expect(core.monster().trick).toBeUndefined();
  });

  it("a woken Monster dashes off", () => {
    const core = dozingSleepy();
    tapMonster(core);
    const { x, y } = core.monster();
    runFor(core, 0.3);

    expect(Math.hypot(core.monster().x - x, core.monster().y - y)).toBeGreaterThan(20);
  });

  it("the tap after waking it is a Bonk", () => {
    const core = dozingSleepy();
    tapMonster(core);
    const before = core.monster().dizzy;

    expect(tapMonster(core)).toBe("bonk");
    expect(core.monster().dizzy).toBe(before + 1);
  });

  it("a Flick on a dozing Monster only wakes it", () => {
    const core = dozingSleepy();
    const before = core.monster().dizzy;

    expect(core.flick(swipeAcross(core))).toBe("boing");
    expect(core.monster().dizzy).toBe(before);
    expect(core.monster().flying).toBe(false);
    expect(core.monster().trick).toBeUndefined();
  });

  it("a dozing Monster wakes on its own", () => {
    const core = dozingSleepy();
    let seconds = 0;
    runUntil(
      core,
      () => {
        if (core.monster().trick === undefined) return true;
        seconds += 1 / 60;
        return false;
      },
      20,
    );

    expect(seconds).toBeGreaterThan(1.5);
    expect(seconds).toBeLessThan(6);
    runFor(core, 0.2);
    expect(speedOf(core)).toBeGreaterThan(0);
  });

  it("a fully Dizzy Monster doesn't Doze, so the final catching tap always works", () => {
    const core = catchWith({ temperament: "sleepy" });
    for (let i = 0; i < 20 && !core.monster().readyToCatch; i++) {
      runUntil(core, () => !core.monster().stunned && core.monster().trick === undefined);
      tapMonster(core);
    }
    expect(core.monster().readyToCatch).toBe(true);
    let dozed = false;
    runFor(core, 60, () => {
      if (core.monster().trick) dozed = true;
    });

    expect(dozed).toBe(false);
    expect(tapMonster(core)).toBe("caught");
  });
});
