import { describe, expect, it } from "vitest";
import { TEMPERAMENTS } from "./temperaments";
import type { GameCore } from "./gameCore";
import { buildCore, groundCovered, runFor, runUntil, speedOf, tapMonster, type CatchOptions } from "./testing";

const EVERY_TEMPERAMENT = TEMPERAMENTS.map((t) => t.id);

const catchWith = (options: CatchOptions) => buildCore(1, undefined, options);

/** Bonks the Monster and times how long it stays Stunned, in seconds. */
function stunnedSeconds(core: GameCore): number {
  expect(tapMonster(core)).toBe("bonk");
  let seconds = 0;
  runUntil(core, () => {
    if (core.monster().stunned) seconds += 1 / 60;
    return !core.monster().stunned;
  });
  return seconds;
}

/**
 * The different slants the Monster moves at over `seconds`, ignoring which
 * way along them. Bouncing off a wall keeps the slant, so a Monster that only
 * goes in straight lines between walls has just one.
 */
function slants(core: GameCore, seconds: number): Set<number> {
  const seen = new Set<number>();
  runFor(core, seconds, () => {
    const { vx, vy } = core.monster();
    seen.add(Math.round(Math.abs(Math.atan2(Math.abs(vy), Math.abs(vx))) * 100));
  });
  return seen;
}

/** The slowest and fastest the Monster moves over `seconds`, left alone. */
function speedRange(core: GameCore, seconds: number) {
  let slowest = Infinity;
  let fastest = 0;
  runFor(core, seconds, () => {
    slowest = Math.min(slowest, speedOf(core));
    fastest = Math.max(fastest, speedOf(core));
  });
  return { slowest, fastest };
}

/** How much faster than its normal speed the Monster dashes off after a Bonk. */
function dashBurst(core: GameCore): number {
  const normal = speedOf(core);
  tapMonster(core);
  runUntil(core, () => !core.monster().stunned);
  core.tick(1 / 60);
  return speedOf(core) / normal;
}

/** Bonks the Monster three times, then times how long until its Dizzy has all drained away. */
function drainSeconds(core: GameCore): number {
  for (let i = 0; i < 3; i++) {
    runUntil(core, () => !core.monster().stunned);
    expect(tapMonster(core)).toBe("bonk");
  }
  let seconds = 0;
  runUntil(core, () => {
    seconds += 1 / 60;
    return core.monster().dizzy === 0;
  });
  return seconds;
}

describe("Temperaments", () => {
  it("kids see the sturdy Temperament as Shy, while its stored value stays sturdy", () => {
    expect(TEMPERAMENTS.find((t) => t.id === "sturdy")).toMatchObject({ word: "Shy", icon: "🙈" });
    expect(TEMPERAMENTS.map((t) => t.word)).not.toContain("Sturdy");
  });

  it("a Speedy Monster moves faster than a Sleepy one", () => {
    const speedy = catchWith({ temperament: "speedy" });
    const sleepy = catchWith({ temperament: "sleepy" });

    expect(groundCovered(speedy, 10)).toBeGreaterThan(groundCovered(sleepy, 10) * 1.3);
  });

  it("a Shy Monster shakes off a Bonk sooner than a Sleepy one", () => {
    const shy = stunnedSeconds(catchWith({ temperament: "sturdy" }));
    const sleepy = stunnedSeconds(catchWith({ temperament: "sleepy" }));

    expect(shy).toBeLessThan(sleepy * 0.8);
  });

  it("a Speedy Monster dashes off in a bigger burst than a Shy one", () => {
    const speedy = dashBurst(catchWith({ temperament: "speedy" }));
    const shy = dashBurst(catchWith({ temperament: "sturdy" }));

    expect(speedy).toBeGreaterThan(shy * 1.2);
  });

  it("a Speedy Monster goes in straight lines between walls", () => {
    expect(slants(catchWith({ temperament: "speedy" }), 10).size).toBe(1);
  });

  it("a Sneaky Monster changes direction on its own, away from the walls", () => {
    expect(slants(catchWith({ temperament: "sneaky" }), 10).size).toBeGreaterThan(4);
  });

  it("a Bouncy Monster hops: its speed keeps rising and falling", () => {
    const bouncy = speedRange(catchWith({ temperament: "bouncy" }), 3);
    const speedy = speedRange(catchWith({ temperament: "speedy" }), 3);

    expect(bouncy.slowest).toBeLessThan(bouncy.fastest * 0.5);
    expect(speedy.slowest).toBeCloseTo(speedy.fastest);
  });

  it("a Shy Monster gets over being Dizzy faster than a Sleepy one", () => {
    const shy = drainSeconds(catchWith({ temperament: "sturdy" }));
    const sleepy = drainSeconds(catchWith({ temperament: "sleepy" }));

    expect(shy).toBeLessThan(sleepy * 0.8);
  });
});

describe("hard mode", () => {
  it.each(EVERY_TEMPERAMENT)("makes a %s Monster move faster", (temperament) => {
    const normal = catchWith({ temperament });
    const hard = catchWith({ temperament, hardMode: true });

    expect(groundCovered(hard, 10)).toBeGreaterThan(groundCovered(normal, 10) * 1.1);
  });

  it.each(EVERY_TEMPERAMENT)("makes a %s Monster's Stunned shorter", (temperament) => {
    const normal = stunnedSeconds(catchWith({ temperament }));
    const hard = stunnedSeconds(catchWith({ temperament, hardMode: true }));

    expect(hard).toBeLessThan(normal * 0.9);
  });

  it("makes a Monster's dash a bigger burst", () => {
    const normal = dashBurst(catchWith({ temperament: "sturdy" }));
    const hard = dashBurst(catchWith({ temperament: "sturdy", hardMode: true }));

    expect(hard).toBeGreaterThan(normal * 1.1);
  });

  it.each(EVERY_TEMPERAMENT)("makes a %s Monster's Dizzy drain faster", (temperament) => {
    const normal = drainSeconds(catchWith({ temperament }));
    const hard = drainSeconds(catchWith({ temperament, hardMode: true }));

    expect(hard).toBeLessThan(normal * 0.9);
  });
});

describe("a Catch can't fail, whatever the Temperament", () => {
  const everyCatch = EVERY_TEMPERAMENT.flatMap((temperament) => [
    { temperament, hardMode: false },
    { temperament, hardMode: true },
  ]);

  it.each(everyCatch)("a $temperament Monster (hard mode: $hardMode) gets sleepy and slows after about 2 minutes", (options) => {
    const core = catchWith(options);
    runFor(core, 60);
    expect(core.monster().sleepy).toBe(false);
    const awake = groundCovered(core, 5);

    runFor(core, 120);

    expect(core.monster().sleepy).toBe(true);
    expect(groundCovered(core, 5)).toBeLessThan(awake * 0.8);
  });

  it.each(everyCatch)("a slow kid still catches a sleepy $temperament Monster (hard mode: $hardMode)", (options) => {
    const core = catchWith(options);
    runFor(core, 130);

    // One tap every five seconds: slower than Dizzy starts to drain.
    for (let taps = 0; !core.monster().caught; taps++) {
      if (taps > 30) throw new Error("Never caught");
      tapMonster(core);
      runFor(core, 5);
    }
  });
});
