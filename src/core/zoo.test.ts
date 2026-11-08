import { describe, expect, it } from "vitest";
import type { GameCore } from "./gameCore";
import { inMemoryZooStorage } from "./zooStorage";
import { A_DAY, AN_IMAGE, buildCore, catchIt, fakeClock, newGame, runFor, tapMonster } from "./testing";

/** Catches a Monster and goes back to the Zoo with it. */
function catchAndGoToZoo(core: GameCore) {
  catchIt(core);
  core.goToZoo();
}

describe("the Zoo", () => {
  it("is where the app opens, empty at first", () => {
    const core = newGame();

    expect(core.phase()).toBe("zoo");
    expect(core.zoo()).toEqual([]);
  });

  it("a caught Monster appears in the Zoo", () => {
    const core = buildCore(1, undefined, { temperament: "sneaky" });
    const { name, mainColor } = core.monster();

    catchIt(core);
    core.goToZoo();

    expect(core.phase()).toBe("zoo");
    expect(core.zoo()).toHaveLength(1);
    expect(core.zoo()[0]).toMatchObject({ name, mainColor, temperament: "sneaky" });
    expect(core.zoo()[0].eyes).toHaveLength(1);
  });

  it("is still there after reloading from storage", async () => {
    const storage = inMemoryZooStorage();
    const core = buildCore(1, undefined, { storage, temperament: "bouncy" });
    catchAndGoToZoo(core);
    const before = core.zoo()[0];
    await core.saved();

    const reloaded = newGame({ seed: 2, storage });
    await reloaded.loadZoo();

    expect(reloaded.zoo()).toHaveLength(1);
    const after = reloaded.zoo()[0];
    expect(after).toMatchObject({
      id: before.id,
      name: before.name,
      temperament: "bouncy",
      mainColor: before.mainColor,
      drawnAt: before.drawnAt,
      image: AN_IMAGE,
      width: before.width,
      height: before.height,
    });
    expect(after.eyes.map(({ x, y }) => ({ x, y }))).toEqual(before.eyes.map(({ x, y }) => ({ x, y })));
  });

  it("a caught Monster can't be caught again", () => {
    const core = buildCore();
    catchIt(core);

    expect(tapMonster(core)).toBe("miss");
    expect(core.startCatch()).toBe(false);
    core.goToZoo();
    const [inZoo] = core.zoo();
    expect(core.bonk({ x: inZoo.x, y: inZoo.y })).toBe("miss");
    expect(core.flick([{ x: inZoo.x - 200, y: inZoo.y }, { x: inZoo.x + 200, y: inZoo.y }])).toBe("miss");

    expect(core.phase()).toBe("zoo");
    expect(core.zoo()).toHaveLength(1);
  });

  it("gets a new Monster from each Round, never the same one twice", () => {
    const core = buildCore();
    catchAndGoToZoo(core);
    core.startRound();
    core.finishDrawing({ width: 300, height: 500, inkAmount: 40_000, mainColor: "green" }, AN_IMAGE);
    core.placeEye({ x: 0.5, y: 0.5 });
    core.pickTemperament("sleepy");
    core.startCatch();
    catchAndGoToZoo(core);

    const zoo = core.zoo();
    expect(zoo).toHaveLength(2);
    expect(zoo[0].id).not.toBe(zoo[1].id);
    expect(zoo.map((m) => m.mainColor)).toEqual(["purple", "green"]);
  });

  it("saves the Monster as sync-ready plain data", async () => {
    const storage = inMemoryZooStorage();
    const core = buildCore(1, undefined, { storage, clock: fakeClock(A_DAY), temperament: "sturdy" });
    const { name } = core.monster();
    catchIt(core);
    await core.saved();

    const [record] = await storage.list();
    expect(record).toEqual({
      schemaVersion: 2,
      id: expect.any(String),
      name,
      image: AN_IMAGE,
      drawingSize: { width: 400, height: 400 },
      eyes: [{ x: 0.5, y: 0.3 }],
      temperament: "sturdy",
      bio: expect.stringMatching(/one googly eye/),
      mainColor: "purple",
      drawnAt: "2026-11-07T12:00:00.000Z",
      status: "zoo",
      habitat: 0,
    });
  });

  it("dates the Monster from when its drawing was finished", async () => {
    const clock = fakeClock(A_DAY);
    const core = newGame({ clock });
    core.startRound();
    core.finishDrawing({ width: 400, height: 400, inkAmount: 50_000, mainColor: "red" }, AN_IMAGE);
    clock.advance(10 * 60 * 1000); // ten minutes bringing it to life and catching it
    core.placeEye({ x: 0.5, y: 0.5 });
    core.pickTemperament("speedy");
    core.startCatch();
    catchAndGoToZoo(core);

    expect(core.zoo()[0].drawnAt).toBe("2026-11-07T12:00:00.000Z");
  });

  it("has its Monsters wander around the Habitat, bouncing off its edges", () => {
    const core = buildCore();
    catchAndGoToZoo(core);
    const { width, height } = core.arena;
    const start = core.zoo()[0];
    const near = 5;
    const seen = { left: false, right: false, top: false, bottom: false };
    const headings = new Set<number>();

    runFor(core, 120, () => {
      const m = core.zoo()[0];
      expect(m.x - m.width / 2).toBeGreaterThanOrEqual(0);
      expect(m.x + m.width / 2).toBeLessThanOrEqual(width);
      expect(m.y - m.height / 2).toBeGreaterThanOrEqual(0);
      expect(m.y + m.height / 2).toBeLessThanOrEqual(height);
      if (m.x - m.width / 2 <= near) seen.left = true;
      if (m.x + m.width / 2 >= width - near) seen.right = true;
      if (m.y - m.height / 2 <= near) seen.top = true;
      if (m.y + m.height / 2 >= height - near) seen.bottom = true;
      headings.add(Math.round(Math.atan2(m.vy, m.vx) * 10));
    });

    expect(core.zoo()[0].x).not.toBe(start.x);
    expect(Object.values(seen).filter(Boolean).length).toBeGreaterThanOrEqual(2);
    expect(headings.size).toBeGreaterThan(4); // it turns on its own, not just at the walls
  });

  it("puts Monsters loaded from storage inside the Habitat", async () => {
    const storage = inMemoryZooStorage();
    for (let seed = 1; seed <= 5; seed++) {
      const core = buildCore(seed, undefined, { storage });
      catchIt(core);
      await core.saved();
    }

    const reloaded = newGame({ storage });
    await reloaded.loadZoo();

    const { width, height } = reloaded.arena;
    expect(reloaded.zoo()).toHaveLength(5);
    for (const m of reloaded.zoo()) {
      expect(m.x - m.width / 2).toBeGreaterThanOrEqual(0);
      expect(m.x + m.width / 2).toBeLessThanOrEqual(width);
      expect(m.y - m.height / 2).toBeGreaterThanOrEqual(0);
      expect(m.y + m.height / 2).toBeLessThanOrEqual(height);
    }
  });

  it("doesn't wander while a Round is on", () => {
    const core = buildCore();
    catchAndGoToZoo(core);
    core.startRound();
    const { x, y } = core.zoo()[0];

    runFor(core, 5);

    expect(core.zoo()[0]).toMatchObject({ x, y });
  });
});
