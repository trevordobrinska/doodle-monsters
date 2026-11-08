import { describe, expect, it } from "vitest";
import type { GameCore } from "./gameCore";
import { MONSTER_SCHEMA_VERSION, inMemoryZooStorage, type MonsterRecord, type MonsterStatus } from "./zooStorage";
import { A_DRAWING, AN_IMAGE, catchIt, newGame, runFor } from "./testing";

/** A saved Monster, drawn on day `n` of November 2026 so they sort in order. */
function aMonster(n: number, status: MonsterStatus = "zoo"): MonsterRecord {
  return {
    schemaVersion: MONSTER_SCHEMA_VERSION,
    id: `monster-${n}`,
    name: `Monster ${n}`,
    image: AN_IMAGE,
    drawingSize: { width: 400, height: 400 },
    eyes: [{ x: 0.5, y: 0.3 }],
    temperament: "bouncy",
    bio: status === "zoo" ? "A fine Monster." : "",
    mainColor: "green",
    drawnAt: new Date(Date.UTC(2026, 10, 1, 0, n)).toISOString(),
    status,
  };
}

/** Opens the app on a Zoo that already has `count` Monsters saved. */
async function zooOf(count: number, napping: number[] = []): Promise<GameCore> {
  const storage = inMemoryZooStorage();
  for (let n = 1; n <= count; n++) await storage.save(aMonster(n, napping.includes(n) ? "napping" : "zoo"));
  const core = newGame({ storage });
  await core.loadZoo();
  return core;
}

/** Draws, brings to life and catches a new Monster, then goes back to the Zoo with it. Returns its id. */
function catchANewOne(core: GameCore): string {
  const before = new Set(core.zoo().map((m) => m.id));
  core.startRound();
  core.finishDrawing(A_DRAWING, AN_IMAGE);
  core.placeEye({ x: 0.5, y: 0.5 });
  core.pickTemperament("sleepy");
  core.startCatch();
  catchIt(core);
  core.goToZoo();
  return core.zoo().find((m) => !before.has(m.id))!.id;
}

/** Which Habitat each Monster lives in, by id. */
function homes(core: GameCore): Map<string, number> {
  return new Map(core.zoo().map((m) => [m.id, m.habitat]));
}

/** How many Monsters live in each Habitat. */
function crowding(core: GameCore): number[] {
  const counts = Array.from({ length: core.habitatCount() }, () => 0);
  for (const m of core.zoo()) counts[m.habitat]++;
  return counts;
}

describe("Habitats", () => {
  it("a small Zoo is all one Habitat", async () => {
    const core = await zooOf(7);

    expect(core.habitatCount()).toBe(1);
    expect(core.monstersShown()).toHaveLength(7);
  });

  it("a Zoo with more than about 10 Monsters is split into several Habitats", async () => {
    const core = await zooOf(25);

    expect(core.habitatCount()).toBeGreaterThan(1);
    expect(crowding(core).every((count) => count > 0 && count <= 10)).toBe(true);
  });

  it("every Monster is in exactly one Habitat", async () => {
    const core = await zooOf(25, [4, 17]);

    const seen: string[] = [];
    for (let i = 0; i < core.habitatCount(); i++) {
      expect(core.showHabitat(i)).toBe(true);
      seen.push(...core.monstersShown().map((m) => m.id));
    }

    expect([...seen].sort()).toEqual(Array.from({ length: 25 }, (_, i) => `monster-${i + 1}`).sort());
  });

  it("a newly caught Monster goes into a Habitat with room, and the kid sees it arrive", async () => {
    const core = await zooOf(10);
    const before = homes(core);

    const id = catchANewOne(core);

    const arrived = core.zoo().find((m) => m.id === id)!;
    expect(crowding(core).every((count) => count <= 10)).toBe(true);
    expect(core.shownHabitat()).toBe(arrived.habitat);
    expect(core.monstersShown().map((m) => m.id)).toContain(id);
    for (const [other, habitat] of before) expect(homes(core).get(other)).toBe(habitat);
  });

  it("Saying Goodbye doesn't move any other Monster to another Habitat", async () => {
    const core = await zooOf(25);
    core.showHabitat(1);
    const leaving = core.monstersShown()[3];
    const before = homes(core);

    core.sayGoodbye(leaving.id);
    runFor(core, 20);

    before.delete(leaving.id);
    expect(homes(core)).toEqual(before);
    expect(core.shownHabitat()).toBe(1);
  });

  it("a tap only finds Monsters in the Habitat shown", async () => {
    const core = await zooOf(15);
    const elsewhere = core.zoo().find((m) => m.habitat === 1)!;
    core.showHabitat(0);
    const there = (id: string) => core.zoo().find((m) => m.id === id)!;

    const atElsewhere = { x: there(elsewhere.id).x, y: there(elsewhere.id).y };
    expect(core.zooMonsterAt(atElsewhere)?.habitat).not.toBe(1);

    core.showHabitat(1);
    expect(core.zooMonsterAt(atElsewhere)).toMatchObject({ habitat: 1 });
  });

  it("the kid can only move to a Habitat there is", async () => {
    const core = await zooOf(15);

    expect(core.showHabitat(2)).toBe(false);
    expect(core.showHabitat(-1)).toBe(false);
    expect(core.shownHabitat()).toBe(0);
  });

  it("opens on the Habitat with a Napping Monster, so the kid sees it waiting", async () => {
    const core = await zooOf(25, [23]);

    expect(core.monstersShown().find((m) => m.id === "monster-23")).toMatchObject({ napping: true });
  });

  it("nobody changes Habitat when the app is opened again, even after a Goodbye and a catch", async () => {
    const storage = inMemoryZooStorage();
    for (let n = 1; n <= 15; n++) await storage.save(aMonster(n));
    const core = newGame({ storage });
    await core.loadZoo();
    core.sayGoodbye(core.monstersShown()[0].id);
    runFor(core, 20);
    catchANewOne(core);
    const before = homes(core);
    await core.saved();

    const reopened = newGame({ seed: 2, storage });
    await reopened.loadZoo();

    expect(homes(reopened)).toEqual(before);
  });
});
