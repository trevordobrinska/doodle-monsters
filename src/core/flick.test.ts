import { describe, expect, it } from "vitest";
import { buildCore, runUntil, swipeAcross, tapMonster, tickResultsFor } from "./testing";

describe("a Flick", () => {
  it("adds two steps of Dizzy", () => {
    const core = buildCore();

    expect(core.flick(swipeAcross(core))).toBe("flick");

    expect(core.monster().dizzy).toBe(2);
  });

  it("that misses does nothing", () => {
    const core = buildCore();
    const { x, y, width } = core.monster();
    const before = core.monster();

    // A swipe well above the Monster, passing it by.
    const result = core.flick([
      { x: x - width, y: y - width * 1.5 },
      { x: x + width, y: y - width * 1.5 },
    ]);

    expect(result).toBe("miss");
    expect(core.monster()).toEqual(before);
  });

  it("while Stunned adds nothing", () => {
    const core = buildCore();
    tapMonster(core);
    expect(core.monster().stunned).toBe(true);

    expect(core.flick(swipeAcross(core))).toBe("boing");

    expect(core.monster().dizzy).toBe(1);
  });

  it("flings the Monster in the swipe direction until it hits a wall", () => {
    const core = buildCore();
    const { y } = core.monster();

    core.flick(swipeAcross(core));
    expect(core.monster().flying).toBe(true);
    expect(core.monster().vx).toBeGreaterThan(0);
    expect(core.monster().vy).toBeCloseTo(0);

    runUntil(core, () => !core.monster().flying, 5);

    const { x, width } = core.monster();
    expect(x + width / 2).toBeCloseTo(core.arena.width);
    expect(core.monster().y).toBeCloseTo(y);
  });

  it("leaves the Monster Stunned against the wall, then it dashes off", () => {
    const core = buildCore();
    core.flick(swipeAcross(core));
    runUntil(core, () => !core.monster().flying, 5);
    const { x, y } = core.monster();

    expect(core.monster().stunned).toBe(true);
    expect(tapMonster(core)).toBe("boing");
    expect(core.monster()).toMatchObject({ x, y });

    runUntil(core, () => !core.monster().stunned, 5);
    core.tick(1 / 60);
    expect(core.monster().x).not.toBeCloseTo(x);
  });

  it("reports the moment the flung Monster hits the wall, once", () => {
    const core = buildCore();
    core.flick(swipeAcross(core));

    const results = tickResultsFor(core, 3);

    expect(results.filter((r) => r === "wallHit")).toHaveLength(1);
  });

  it("doesn't report ordinary bounces off the walls as wall hits", () => {
    const core = buildCore();
    // Long enough to bounce off several walls.
    const results = tickResultsFor(core, 20);

    expect(results).not.toContain("wallHit");
  });

  it("can't be Bonked or Flicked again while it's flying", () => {
    const core = buildCore();
    core.flick(swipeAcross(core));

    expect(tapMonster(core)).toBe("boing");
    expect(core.flick(swipeAcross(core))).toBe("boing");

    expect(core.monster().dizzy).toBe(2);
  });

  it("never pushes Dizzy past full", () => {
    const core = buildCore();
    for (let i = 0; i < core.monster().fullDizzy - 1; i++) {
      runUntil(core, () => !core.monster().stunned);
      tapMonster(core);
    }
    runUntil(core, () => !core.monster().stunned);

    expect(core.flick(swipeAcross(core))).toBe("flick");

    expect(core.monster().dizzy).toBe(core.monster().fullDizzy);
    expect(core.monster().readyToCatch).toBe(true);
  });

  it("catches a fully Dizzy Monster, just like a tap", () => {
    const core = buildCore();
    while (!core.monster().readyToCatch) {
      runUntil(core, () => !core.monster().stunned && !core.monster().flying);
      core.flick(swipeAcross(core));
    }
    runUntil(core, () => !core.monster().stunned && !core.monster().flying);

    expect(core.flick(swipeAcross(core))).toBe("caught");

    expect(core.monster().caught).toBe(true);
  });
});
