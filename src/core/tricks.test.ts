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
    for (const temperament of ["bouncy", "sturdy", "sleepy"] as const) {
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
      if (!trick) return true;
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
    runUntil(core, () => core.monster().trick !== undefined && core.monster().trick!.opacity < 0.5);

    expect(core.flick(swipeAcross(core))).toBe("flick");
  });
});

describe("After-image", () => {
  /** The fake copy a Speedy Monster has left behind, if any. */
  function fakeOf(core: GameCore) {
    const trick = core.monster().trick;
    return trick?.trick === "afterImage" ? trick : undefined;
  }

  /**
   * Bonks a Speedy Monster up to `dizzy`, then keeps Bonking it whenever
   * it's free until it leaves an after-image as it dashes off. The default
   * leaves room for 2 more Bonks before it's fully Dizzy.
   */
  function speedyWithAfterImage(dizzy = 4): GameCore {
    const core = catchWith({ temperament: "speedy" });
    runUntil(core, () => {
      if (fakeOf(core)) return true;
      const m = core.monster();
      if (!m.stunned && m.dizzy < dizzy) tapMonster(core);
      return false;
    });
    return core;
  }

  /** Waits until the real Monster has run clear of its after-image. */
  function clearOfFake(core: GameCore) {
    runUntil(core, () => {
      const fake = fakeOf(core)!;
      const m = core.monster();
      return Math.hypot(m.x - fake.x, m.y - fake.y) > m.width * 1.5;
    });
  }

  it("a tap on the after-image goes boing", () => {
    const core = speedyWithAfterImage();
    clearOfFake(core);
    const fake = fakeOf(core)!;
    const before = core.monster().dizzy;

    expect(core.bonk({ x: fake.x, y: fake.y })).toBe("boing");
    expect(core.monster().dizzy).toBe(before);
    expect(fakeOf(core)).toBeUndefined();
  });

  it("a tap on the real Monster still Bonks while there's an after-image", () => {
    const core = speedyWithAfterImage();
    clearOfFake(core);
    const before = core.monster().dizzy;

    expect(tapMonster(core)).toBe("bonk");
    expect(core.monster().dizzy).toBe(before + 1);
  });

  it("a tap where the after-image and the real Monster overlap Bonks the real one", () => {
    const core = speedyWithAfterImage();
    const fake = fakeOf(core)!;
    const before = core.monster().dizzy;

    expect(core.bonk({ x: fake.x, y: fake.y })).toBe("bonk");
    expect(core.monster().dizzy).toBe(before + 1);
  });

  it("the after-image appears where the Monster was, stays still for about a second, then fades away", () => {
    const core = speedyWithAfterImage();
    const first = fakeOf(core)!;
    const m = core.monster();
    expect(Math.hypot(first.x - m.x, first.y - m.y)).toBeLessThan(m.width / 2);

    let seconds = 0;
    let lastOpacity = 1;
    runUntil(core, () => {
      const fake = fakeOf(core);
      if (!fake) return true;
      expect(fake.x).toBe(first.x);
      expect(fake.y).toBe(first.y);
      seconds += 1 / 60;
      lastOpacity = fake.opacity;
      return false;
    });

    expect(seconds).toBeGreaterThan(0.7);
    expect(seconds).toBeLessThan(1.6);
    expect(lastOpacity).toBeLessThan(0.3);
  });

  it("there's only one after-image at a time", () => {
    const core = speedyWithAfterImage();
    const first = fakeOf(core)!;
    // Bonk the real one again, so it dashes off again while the fake is still there.
    tapMonster(core);
    runUntil(core, () => !core.monster().stunned);
    core.tick(1 / 60);

    expect(fakeOf(core)).toMatchObject({ x: first.x, y: first.y });
  });

  it("a fully Dizzy Monster leaves no after-images, so the catching tap always works", () => {
    const core = speedyWithAfterImage(5);
    clearOfFake(core);
    // The Bonk that makes it fully Dizzy, while its after-image is still there.
    expect(tapMonster(core)).toBe("bonk");
    expect(core.monster().readyToCatch).toBe(true);
    let fakeWhileFullyDizzy = false;
    runFor(core, 30, () => {
      if (fakeOf(core)) fakeWhileFullyDizzy = true;
    });

    expect(fakeWhileFullyDizzy).toBe(false);
    expect(tapMonster(core)).toBe("caught");
  });
});
