import { describe, expect, it } from "vitest";
import { inMemoryZooStorage } from "./zooStorage";
import { buildCore, catchIt, newGame, tapMonster } from "./testing";

describe("Napping", () => {
  it("leaving a Catch leaves the Monster Napping in the Zoo", async () => {
    const storage = inMemoryZooStorage();
    const core = buildCore(1, undefined, { storage, temperament: "sneaky" });
    const { name, mainColor } = core.monster();

    expect(core.leave()).toBe(true);

    expect(core.phase()).toBe("zoo");
    expect(core.zoo()).toHaveLength(1);
    expect(core.zoo()[0]).toMatchObject({ name, mainColor, temperament: "sneaky", napping: true });
    expect(core.zoo()[0].eyes.map(({ x, y }) => ({ x, y }))).toEqual([{ x: 0.5, y: 0.3 }]);
    await core.saved();
    expect((await storage.list()).map((r) => r.status)).toEqual(["napping"]);
  });

  it("resuming returns to the Catch", () => {
    const core = buildCore(1, undefined, { temperament: "bouncy" });
    tapMonster(core);
    const { name, mainColor, width, height } = core.monster();
    core.leave();
    const [napping] = core.zoo();

    const tapped = core.zooMonsterAt({ x: napping.x, y: napping.y });
    expect(tapped?.id).toBe(napping.id);
    expect(core.resume(napping.id)).toBe(true);

    expect(core.phase()).toBe("catch");
    expect(core.monster()).toMatchObject({ name, mainColor, width, height, temperament: "bouncy", caught: false, dizzy: 0 });
    expect(core.monster().eyes.map(({ x, y }) => ({ x, y }))).toEqual([{ x: 0.5, y: 0.3 }]);
    expect(core.zoo()).toEqual([]);
  });

  it("Napping survives reloading from storage", async () => {
    const storage = inMemoryZooStorage();
    const core = buildCore(1, undefined, { storage, temperament: "sleepy" });
    const { name } = core.monster();
    core.leave();
    await core.saved();

    const reloaded = newGame({ seed: 2, storage });
    await reloaded.loadZoo();

    expect(reloaded.zoo()).toHaveLength(1);
    const [napping] = reloaded.zoo();
    expect(napping).toMatchObject({ name, temperament: "sleepy", napping: true });
    expect(reloaded.resume(napping.id)).toBe(true);
    expect(reloaded.monster()).toMatchObject({ name, temperament: "sleepy" });
  });

  it("is saved the moment its Catch begins, so even closing the app without warning keeps it", async () => {
    const storage = inMemoryZooStorage();
    const core = buildCore(1, undefined, { storage });
    await core.saved();

    const reloaded = newGame({ seed: 2, storage });
    await reloaded.loadZoo();

    expect(reloaded.zoo()).toMatchObject([{ name: core.monster().name, napping: true }]);
  });

  it("catching a resumed Monster makes it a normal Zoo Monster", async () => {
    const storage = inMemoryZooStorage();
    const core = buildCore(1, undefined, { storage });
    core.leave();
    const [napping] = core.zoo();
    core.resume(napping.id);

    catchIt(core);
    core.goToZoo();
    await core.saved();

    expect(core.zoo()).toMatchObject([{ id: napping.id, napping: false }]);
    expect(core.zoo()[0].vx !== 0 || core.zoo()[0].vy !== 0).toBe(true);
    expect((await storage.list()).map((r) => ({ id: r.id, status: r.status }))).toEqual([{ id: napping.id, status: "zoo" }]);
    expect(core.resume(napping.id)).toBe(false);
  });

  it("only leaves from an unfinished Catch", () => {
    const drawing = newGame();
    drawing.startRound();
    expect(drawing.leave()).toBe(false);

    const caught = buildCore();
    catchIt(caught);
    expect(caught.leave()).toBe(false);
    expect(caught.zoo()).toMatchObject([{ napping: false }]);
  });

  it("only a Napping Monster can be resumed, and only from the Zoo", () => {
    const core = buildCore(1);
    catchIt(core);
    core.goToZoo();
    const [inZoo] = core.zoo();

    expect(core.resume(inZoo.id)).toBe(false);
    expect(core.resume("no-such-monster")).toBe(false);
    expect(core.phase()).toBe("zoo");
  });

  it("taps on empty grass find no Monster", () => {
    const core = buildCore();
    core.leave();
    const [napping] = core.zoo();
    const { width, height } = core.arena;
    // The far corner of the Habitat from the Monster.
    const farAway = { x: napping.x < width / 2 ? width - 1 : 1, y: napping.y < height / 2 ? height - 1 : 1 };

    expect(core.zooMonsterAt(farAway)).toBeUndefined();
  });
});
