import { describe, expect, it } from "vitest";
import type { GameCore } from "./gameCore";
import type { Temperament } from "./temperaments";
import { inMemoryZooStorage, type ZooStorage } from "./zooStorage";
import { A_DRAWING, AN_IMAGE, catchIt, newGame, newRound, runFor, runUntil } from "./testing";

interface MonsterOptions {
  seed?: number;
  eyes?: number;
  mainColor?: string;
  temperament?: Temperament;
  storage?: ZooStorage;
}

/** Draws, brings to life and catches a Monster, then goes back to the Zoo with it. */
function catchMonster({ seed = 1, eyes = 1, mainColor = "purple", temperament = "speedy", storage }: MonsterOptions = {}): GameCore {
  const core = newRound(seed, { storage });
  core.finishDrawing({ ...A_DRAWING, mainColor }, AN_IMAGE);
  for (let i = 0; i < eyes; i++) core.placeEye({ x: 0.2 + i * 0.15, y: 0.3 });
  core.pickTemperament(temperament);
  core.startCatch();
  catchIt(core);
  core.goToZoo();
  return core;
}

describe("the Bio", () => {
  it("mentions the eye count, main color and Temperament", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const three = catchMonster({ seed, eyes: 3, mainColor: "orange", temperament: "sneaky" }).zoo()[0].bio;
      expect(three).toMatch(/\bthree googly eyes\b/i);
      expect(three).toMatch(/\borange\b/i);
      expect(three).toMatch(/\bsneaky\b/i);
    }
    const one = catchMonster({ eyes: 1, mainColor: "green", temperament: "sleepy" }).zoo()[0].bio;
    expect(one).toMatch(/\bone googly eye\b/i);
    expect(one).toMatch(/\bgreen\b/i);
    expect(one).toMatch(/\bsleepy\b/i);
  });

  it("the same dice gives the same Bio", () => {
    const bioFor = (seed: number) => catchMonster({ seed, eyes: 2, temperament: "bouncy" }).zoo()[0].bio;

    expect(bioFor(7)).toBe(bioFor(7));
    // ...while different dice give the Zoo some variety.
    expect(new Set([1, 2, 3, 4, 5, 6, 7, 8].map(bioFor)).size).toBeGreaterThan(1);
  });

  it("is written once when caught and saved with the Monster", async () => {
    const storage = inMemoryZooStorage();
    const core = catchMonster({ storage });
    const { bio } = core.zoo()[0];
    await core.saved();

    expect((await storage.list())[0].bio).toBe(bio);
    const reloaded = newGame({ seed: 99, storage });
    await reloaded.loadZoo();
    expect(reloaded.zoo()[0].bio).toBe(bio);
  });

  it("a Monster caught before Bios existed gets one when the Zoo loads", async () => {
    const storage = inMemoryZooStorage();
    const core = catchMonster({ storage, eyes: 4, mainColor: "blue", temperament: "sturdy" });
    await core.saved();
    const [record] = await storage.list();
    await storage.save({ ...record, bio: "" });

    const reloaded = newGame({ seed: 2, storage });
    await reloaded.loadZoo();
    await reloaded.saved();

    const { bio } = reloaded.zoo()[0];
    expect(bio).toMatch(/four googly eyes/i);
    expect((await storage.list())[0].bio).toBe(bio);
  });
});

describe("Say Goodbye", () => {
  it("removes the Monster from the Zoo", async () => {
    const storage = inMemoryZooStorage();
    const core = catchMonster({ storage });
    await core.saved();
    await catchMonster({ storage, seed: 2 }).saved(); // a second Monster, in the same Zoo
    await core.loadZoo();
    const [leaving, staying] = core.zoo();

    expect(core.sayGoodbye(leaving.id)).toBe(true);
    await core.saved();

    expect((await storage.list()).map((r) => r.id)).toEqual([staying.id]);
    runUntil(core, () => core.zoo().length === 1, 30);
    expect(core.zoo().map((m) => m.id)).toEqual([staying.id]);
    const reloaded = newGame({ seed: 3, storage });
    await reloaded.loadZoo();
    expect(reloaded.zoo().map((m) => m.id)).toEqual([staying.id]);
  });

  it("the Monster waves, then walks out of the Habitat", () => {
    const core = catchMonster();
    const [monster] = core.zoo();
    core.sayGoodbye(monster.id);

    expect(core.zoo()[0]).toMatchObject({ waving: true, leaving: true, vx: 0, vy: 0 });
    runUntil(core, () => !core.zoo()[0].waving, 5);
    const walking = core.zoo()[0];
    expect(walking.leaving).toBe(true);
    expect(walking.vx).not.toBe(0);
    expect(walking.vy).toBe(0);

    // It keeps walking past the edge rather than bouncing back in, and is gone once out of sight.
    let last = walking;
    runUntil(core, () => {
      if (core.zoo().length > 0) last = core.zoo()[0];
      return core.zoo().length === 0;
    }, 30);
    expect(walking.vx > 0 ? last.x > core.arena.width : last.x < 0).toBe(true);
  });

  it("a Monster Saying Goodbye can't be tapped, or Said Goodbye to again", () => {
    const core = catchMonster();
    const [monster] = core.zoo();
    core.sayGoodbye(monster.id);

    expect(core.zooMonsterAt({ x: monster.x, y: monster.y })).toBeUndefined();
    expect(core.sayGoodbye(monster.id)).toBe(false);
  });

  it("only works in the Zoo, on a Monster that's there", () => {
    const core = catchMonster();
    const [monster] = core.zoo();
    expect(core.sayGoodbye("no-such-monster")).toBe(false);

    core.startRound();
    expect(core.sayGoodbye(monster.id)).toBe(false);
  });

  it("Monsters never leave the Zoo any other way", () => {
    const core = catchMonster();
    runFor(core, 120);
    expect(core.zoo()).toHaveLength(1);
  });

  it("loading the Zoo again never brings it back", async () => {
    const storage = inMemoryZooStorage();
    const core = catchMonster({ storage });
    await core.saved();
    const readBeforeGoodbye = await storage.list();
    core.sayGoodbye(core.zoo()[0].id);
    runUntil(core, () => core.zoo().length === 0, 30);

    // A load that read storage just before the goodbye reached it.
    storage.list = async () => readBeforeGoodbye;
    await core.loadZoo();

    expect(core.zoo()).toEqual([]);
  });
});
