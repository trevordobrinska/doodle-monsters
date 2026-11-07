import { describe, expect, it } from "vitest";
import { A_DRAWING, AN_IMAGE, newRound } from "./testing";

/** A Round whose drawing is done, so it's waiting to be brought to life. */
function drawnRound(seed = 1) {
  const core = newRound(seed);
  core.finishDrawing(A_DRAWING, AN_IMAGE);
  return core;
}

describe("bringing a Monster to life", () => {
  it("comes after the drawing is finished", () => {
    expect(drawnRound().phase()).toBe("bringToLife");
  });

  it("can't start the Catch until it has a Googly Eye", () => {
    const core = drawnRound();
    core.pickTemperament("bouncy");
    expect(core.canStartCatch()).toBe(false);
    expect(core.startCatch()).toBe(false);
    expect(core.phase()).toBe("bringToLife");

    core.placeEye({ x: 0.4, y: 0.3 });

    expect(core.canStartCatch()).toBe(true);
    expect(core.startCatch()).toBe(true);
  });

  it("can't start the Catch until a Temperament is picked", () => {
    const core = drawnRound();
    core.placeEye({ x: 0.4, y: 0.3 });
    expect(core.canStartCatch()).toBe(false);

    core.pickTemperament("sneaky");

    expect(core.canStartCatch()).toBe(true);
    expect(core.startCatch()).toBe(true);
    expect(core.monster().temperament).toBe("sneaky");
  });

  it("takes up to 5 Googly Eyes, and no more", () => {
    const core = drawnRound();
    for (let i = 0; i < 5; i++) expect(core.placeEye({ x: 0.1 + i * 0.2, y: 0.3 })).toBeDefined();

    expect(core.placeEye({ x: 0.5, y: 0.8 })).toBeUndefined();

    expect(core.eyes()).toHaveLength(5);
  });

  it("has room for another Googly Eye once one is taken off", () => {
    const core = drawnRound();
    const eyes = [0.1, 0.3, 0.5, 0.7, 0.9].map((x) => core.placeEye({ x, y: 0.3 })!);

    core.removeEye(eyes[2].id);

    expect(core.eyes().map((e) => e.x)).toEqual([0.1, 0.3, 0.7, 0.9]);
    expect(core.placeEye({ x: 0.5, y: 0.8 })).toBeDefined();
  });

  it("can't start the Catch once its only Googly Eye is taken off", () => {
    const core = drawnRound();
    core.pickTemperament("sturdy");
    const eye = core.placeEye({ x: 0.5, y: 0.3 })!;

    core.removeEye(eye.id);

    expect(core.canStartCatch()).toBe(false);
  });

  it("keeps Googly Eyes where they were stuck on the drawing, and moves them when dragged", () => {
    const core = drawnRound();
    const left = core.placeEye({ x: 0.3, y: 0.25 })!;
    const right = core.placeEye({ x: 0.7, y: 0.25 })!;

    core.moveEye(right.id, { x: 0.6, y: 0.4 });

    expect(core.eyes()).toEqual([
      { id: left.id, x: 0.3, y: 0.25 },
      { id: right.id, x: 0.6, y: 0.4 },
    ]);
  });

  it("keeps Googly Eyes on the drawing, even when dragged past its edge", () => {
    const core = drawnRound();
    const eye = core.placeEye({ x: -0.2, y: 0.5 })!;
    expect(core.eyes()[0]).toMatchObject({ x: 0, y: 0.5 });

    core.moveEye(eye.id, { x: 0.5, y: 1.3 });

    expect(core.eyes()[0]).toMatchObject({ x: 0.5, y: 1 });
  });

  it("brings its Googly Eyes into the Catch", () => {
    const core = drawnRound();
    core.placeEye({ x: 0.3, y: 0.25 });
    core.placeEye({ x: 0.7, y: 0.25 });
    core.pickTemperament("speedy");
    core.startCatch();

    expect(core.monster().eyes.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 0.3, y: 0.25 },
      { x: 0.7, y: 0.25 },
    ]);
  });

  it("can't change its eyes or Temperament once the Catch has begun", () => {
    const core = drawnRound();
    const eye = core.placeEye({ x: 0.3, y: 0.25 })!;
    core.pickTemperament("speedy");
    core.startCatch();

    core.placeEye({ x: 0.7, y: 0.25 });
    core.moveEye(eye.id, { x: 0.9, y: 0.9 });
    core.removeEye(eye.id);
    core.pickTemperament("sleepy");

    expect(core.monster().eyes).toEqual([{ id: eye.id, x: 0.3, y: 0.25 }]);
    expect(core.monster().temperament).toBe("speedy");
  });

  it("gets a generated name as soon as it's drawn", () => {
    expect(drawnRound().name().trim()).not.toBe("");
  });

  it("gets the same name from the same dice, rerolls and all", () => {
    const a = drawnRound(42);
    const b = drawnRound(42);
    expect(a.name()).toBe(b.name());

    a.rerollName();
    b.rerollName();

    expect(a.name()).toBe(b.name());
  });

  it("gets different names from different dice", () => {
    const names = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => drawnRound(seed).name()));

    expect(names.size).toBeGreaterThan(1);
  });

  it("always gets a new name from 🎲", () => {
    const core = drawnRound(3);
    for (let i = 0; i < 1000; i++) {
      const before = core.name();
      core.rerollName();
      expect(core.name()).not.toBe(before);
    }
  });

  it("can be named whatever the kid types", () => {
    const core = drawnRound();
    core.placeEye({ x: 0.5, y: 0.3 });
    core.pickTemperament("bouncy");

    core.setName("Mr Bob");
    expect(core.name()).toBe("Mr Bob");
    core.startCatch();

    expect(core.monster().name).toBe("Mr Bob");
  });

  it("can't start the Catch without a name", () => {
    const core = drawnRound();
    core.placeEye({ x: 0.5, y: 0.3 });
    core.pickTemperament("bouncy");

    core.setName("   ");

    expect(core.canStartCatch()).toBe(false);
    expect(core.startCatch()).toBe(false);
  });

  it("tidies the spaces off the ends of a typed name when the Catch starts", () => {
    const core = drawnRound();
    core.placeEye({ x: 0.5, y: 0.3 });
    core.pickTemperament("bouncy");

    core.setName("  Mr Bob ");
    core.startCatch();

    expect(core.monster().name).toBe("Mr Bob");
  });

  it("cuts a very long typed name short", () => {
    const core = drawnRound();

    core.setName("Bob".repeat(100));

    expect(core.name().length).toBeLessThan(100);
    expect(core.name().startsWith("BobBob")).toBe(true);
  });
});
