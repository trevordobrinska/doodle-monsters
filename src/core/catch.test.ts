import { describe, expect, it } from "vitest";
import type { GameCore } from "./gameCore";
import { buildCore, runFor, runUntil, speedOf, tapMonster } from "./testing";

/** Bonks the Monster again the moment each Stunned ends, until it's fully Dizzy. */
function bonkUntilFullyDizzy(core: GameCore) {
  for (let bonks = 0; !core.monster().readyToCatch; bonks++) {
    if (bonks > 50) throw new Error("Never became fully Dizzy");
    runUntil(core, () => !core.monster().stunned);
    expect(tapMonster(core)).toBe("bonk");
  }
}

/** Bonks the Monster and waits until it has just dashed off from Stunned. */
function bonkAndWaitForDash(core: GameCore) {
  tapMonster(core);
  runUntil(core, () => !core.monster().stunned);
  core.tick(1 / 60);
}

/** Gets the Monster fully Dizzy and waits out the last Stunned, ready for the catching tap. */
function makeReadyToCatch(core: GameCore) {
  bonkUntilFullyDizzy(core);
  runUntil(core, () => !core.monster().stunned);
}

const heading = (core: GameCore) => Math.atan2(core.monster().vy, core.monster().vx);

describe("a Catch", () => {
  it("a Bonk adds one step of Dizzy", () => {
    const core = buildCore();
    expect(core.monster().dizzy).toBe(0);

    expect(tapMonster(core)).toBe("bonk");

    expect(core.monster().dizzy).toBe(1);
  });

  it("a missed tap does nothing", () => {
    const core = buildCore();
    const { x, y, radius } = core.monster();

    expect(core.bonk({ x: x + radius * 3, y })).toBe("miss");

    expect(core.monster().dizzy).toBe(0);
    expect(core.monster().stunned).toBe(false);
  });

  it("is Stunned for about a second after a Bonk, wobbling in place", () => {
    const core = buildCore();
    tapMonster(core);
    const { x, y } = core.monster();

    runFor(core, 0.4);
    expect(core.monster().stunned).toBe(true);
    expect(core.monster()).toMatchObject({ x, y });

    runFor(core, 2.6);
    expect(core.monster().stunned).toBe(false);
  });

  it("taps on a Stunned Monster just boing and add no Dizzy", () => {
    const core = buildCore();
    tapMonster(core);

    for (let i = 0; i < 5; i++) {
      expect(tapMonster(core)).toBe("boing");
      runFor(core, 0.1);
    }

    expect(core.monster().dizzy).toBe(1);
  });

  it("dashes off faster once Stunned ends", () => {
    const core = buildCore();
    const speedBefore = speedOf(core);

    bonkAndWaitForDash(core);

    expect(speedOf(core)).toBeGreaterThan(speedBefore * 1.2);
  });

  it("dashes in a new direction the dice pick", () => {
    const dash = (seed: number) => {
      const core = buildCore(seed);
      const before = heading(core);
      bonkAndWaitForDash(core);
      return { before, after: heading(core) };
    };

    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { before, after } = dash(seed);
      expect(after).not.toBeCloseTo(before, 2);
    }
    // Same dice, same dash.
    expect(dash(7)).toEqual(dash(7));
  });

  it("Dizzy drains after a few seconds without a Bonk", () => {
    const core = buildCore();
    tapMonster(core);
    runUntil(core, () => !core.monster().stunned);
    tapMonster(core);
    expect(core.monster().dizzy).toBe(2);

    runFor(core, 2);
    expect(core.monster().dizzy).toBe(2);

    runFor(core, 30);
    expect(core.monster().dizzy).toBe(0);
  });

  it("is ready to be caught once fully Dizzy", () => {
    const core = buildCore();
    expect(core.monster().readyToCatch).toBe(false);

    bonkUntilFullyDizzy(core);

    expect(core.monster().dizzy).toBe(core.monster().fullDizzy);
    expect(core.monster().caught).toBe(false);
  });

  it("one more tap on a fully Dizzy Monster catches it", () => {
    const core = buildCore();
    makeReadyToCatch(core);

    expect(tapMonster(core)).toBe("caught");

    expect(core.monster().caught).toBe(true);
  });

  it("a caught Monster stays put in its bubble", () => {
    const core = buildCore();
    makeReadyToCatch(core);
    tapMonster(core);
    const { x, y } = core.monster();

    runFor(core, 30);

    expect(core.monster()).toMatchObject({ x, y, caught: true });
    expect(tapMonster(core)).toBe("miss");
  });

  it("gets sleepy and slows down after about 2 minutes", () => {
    const core = buildCore();
    runFor(core, 60);
    expect(core.monster().sleepy).toBe(false);
    const awakeSpeed = speedOf(core);

    runFor(core, 120);

    expect(core.monster().sleepy).toBe(true);
    expect(speedOf(core)).toBeLessThan(awakeSpeed * 0.8);
  });

  it("a sleepy Monster's dash is slower too", () => {
    const dashSpeedAfter = (seconds: number) => {
      const core = buildCore();
      runFor(core, seconds);
      bonkAndWaitForDash(core);
      return speedOf(core);
    };

    expect(dashSpeedAfter(180)).toBeLessThan(dashSpeedAfter(10) * 0.8);
  });

  it("a fully Dizzy Monster stays ready to be caught, however long the kid waits", () => {
    const core = buildCore();
    bonkUntilFullyDizzy(core);

    runFor(core, 30);

    expect(core.monster().readyToCatch).toBe(true);
    expect(tapMonster(core)).toBe("caught");
  });
});
