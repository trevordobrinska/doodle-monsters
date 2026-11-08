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

describe("After-image", () => {
  /** The fake copy a Speedy Monster has left behind, if any. */
  function fakeOf(core: GameCore) {
    const trick = core.monster().trick;
    return trick?.trick === "afterImage" ? trick : undefined;
  }

  /**
   * Bonks a Speedy Monster up to `dizzy`, then keeps Bonking it whenever
   * it's free until it leaves an after-image as it dashes off at that much
   * Dizzy. The default leaves room for 2 more Bonks before it's fully Dizzy.
   */
  function speedyWithAfterImage(dizzy = 4): GameCore {
    const core = catchWith({ temperament: "speedy" });
    let hadFake = false;
    runUntil(core, () => {
      const m = core.monster();
      const justLeftOne = fakeOf(core) !== undefined && !hadFake;
      hadFake = fakeOf(core) !== undefined;
      if (justLeftOne && m.dizzy === dizzy) return true;
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

  it("whether a dash leaves an after-image is up to the ramp, not how long since the last one", () => {
    /** Dashes, and how many left a fake, after a quick Bonk and after a slow one. */
    const after = { quick: { dashes: 0, fakes: 0 }, slow: { dashes: 0, fakes: 0 } };
    for (let seed = 1; seed <= 20; seed++) {
      const core = buildCore(seed, undefined, { temperament: "speedy", hardMode: true });
      let wasStunned = false;
      /** How long it's run free with no fake about, before the last Bonk. */
      let freeFor = 0;
      let bonkedAfter = 0;
      runUntil(core, () => {
        const m = core.monster();
        if (wasStunned && !m.stunned) {
          const tally = bonkedAfter < 1.9 ? after.quick : after.slow;
          tally.dashes++;
          if (fakeOf(core)) tally.fakes++;
        }
        wasStunned = m.stunned;
        freeFor = m.stunned || fakeOf(core) ? 0 : freeFor + 1 / 60;
        // Kept near the top of the ramp, and Bonked only once any fake is
        // gone, so every dash is free to leave one. How long the kid takes
        // depends on how soon its Dizzy drains back below 5.
        const kidReady = m.dizzy < 4 ? !m.stunned : freeFor > 1.5;
        if (kidReady && m.dizzy < 5) {
          bonkedAfter = freeFor;
          tapMonster(core);
        }
        return m.sleepy;
      });
    }
    const share = ({ dashes, fakes }: { dashes: number; fakes: number }) => fakes / dashes;

    expect(after.quick.dashes).toBeGreaterThan(50);
    expect(after.slow.dashes).toBeGreaterThan(50);
    expect(share(after.slow)).toBeGreaterThan(0);
    // "Sometimes", even for a slow kid near the top of the ramp in hard mode.
    expect(share(after.slow)).toBeLessThan(0.8);
    expect(Math.abs(share(after.slow) - share(after.quick))).toBeLessThan(0.15);
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

describe("Shell", () => {
  /** Waits until the Shy Monster (stored as `sturdy`) curls up, and is free to be Bonked. */
  function curledShy(): GameCore {
    const core = catchWith({ temperament: "sturdy" });
    for (let i = 0; i < 5; i++) {
      runUntil(core, () => !core.monster().stunned);
      expect(tapMonster(core)).toBe("bonk");
    }
    runUntil(core, () => core.monster().trick?.trick === "shell" && !core.monster().stunned);
    return core;
  }

  it("a tap on a curled Shy Monster goes boing", () => {
    const core = curledShy();
    const before = core.monster().dizzy;

    expect(tapMonster(core)).toBe("boing");
    expect(core.monster().dizzy).toBe(before);
    expect(core.monster().stunned).toBe(false);
  });

  /** Waits until the Shy Monster is fully curled up: squashed small onto the ground. */
  function fullyCurledShy(): GameCore {
    const core = curledShy();
    runUntil(core, () => {
      const trick = core.monster().trick;
      return trick?.trick === "shell" && trick.curl === 1;
    });
    return core;
  }

  it("a tap on the empty space a curled Shy Monster has shrunk away from is a miss", () => {
    const core = fullyCurledShy();
    const { x, y, height, dizzy } = core.monster();

    expect(core.bonk({ x, y: y - height * 0.4 })).toBe("miss");
    expect(core.monster().dizzy).toBe(dizzy);
  });

  it("a Flick that only crosses the empty space above a curled Shy Monster misses", () => {
    const core = fullyCurledShy();
    const { x, y, width, height } = core.monster();
    const above = y - height * 0.4;

    expect(core.flick([{ x: x - width, y: above }, { x: x + width, y: above }])).toBe("miss");
    expect(core.monster().flying).toBe(false);
  });

  it("a tap on a curled Shy Monster, low down where it's squashed, still goes boing", () => {
    const core = fullyCurledShy();
    const { x, y, height } = core.monster();

    expect(core.bonk({ x, y: y + height * 0.3 })).toBe("boing");
  });

  it("a Flick on a curled Shy Monster still adds two steps", () => {
    const core = curledShy();
    // Let some Dizzy drain, so the Flick adds Dizzy rather than catching it.
    runUntil(core, () => core.monster().dizzy <= 3 && core.monster().trick?.trick === "shell" && !core.monster().stunned);
    const before = core.monster().dizzy;

    expect(core.flick(swipeAcross(core))).toBe("flick");
    expect(core.monster().dizzy).toBe(before + 2);
    expect(core.monster().trick).toBeUndefined();
  });

  it("a Shy Monster stays curled for about a second, and spends most of the Catch uncurled", () => {
    const core = curledShy();
    let seconds = 0;
    runUntil(core, () => {
      if (!core.monster().trick) return true;
      seconds += 1 / 60;
      return false;
    });

    expect(seconds).toBeGreaterThan(0.6);
    expect(seconds).toBeLessThan(1.6);
    expect(trickTimeAt(catchWith({ temperament: "sturdy" }), 5, 100)).toBeLessThan(0.4);
  });

  it("a fully Dizzy Shy Monster doesn't curl up, so the final catching tap always works", () => {
    const core = catchWith({ temperament: "sturdy" });
    for (let i = 0; i < 5; i++) {
      runUntil(core, () => !core.monster().stunned);
      tapMonster(core);
    }
    runUntil(core, () => {
      const m = core.monster();
      return m.dizzy === 5 && !m.stunned && !m.trick;
    });
    expect(tapMonster(core)).toBe("bonk");
    let curled = false;
    runFor(core, 30, () => {
      if (core.monster().trick) curled = true;
    });

    expect(curled).toBe(false);
    expect(tapMonster(core)).toBe("caught");
  });
});

describe("Doze", () => {
  /** Keeps a Sleepy Monster nearly Dizzy until it's dozing, and not Stunned. */
  function dozingSleepy(seed = 1, hardMode = false): GameCore {
    const core = buildCore(seed, undefined, { temperament: "sleepy", hardMode });
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

  it("after a Doze, the next landing tap is a Bonk even if the ramp would fire again", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const core = dozingSleepy(seed, true);
      expect(tapMonster(core)).toBe("boing");
      // Long enough for another Doze to come round, if it could.
      runFor(core, 8);

      expect(core.monster().trick).toBeUndefined();
      expect(tapMonster(core)).toBe("bonk");
    }
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
