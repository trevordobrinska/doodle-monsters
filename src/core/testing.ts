import { createGameCore, type GameCore, type InkFacts, type Point, type TickResult } from "./gameCore";
import { seededDice, type Clock } from "./deps";
import type { Temperament } from "./temperaments";
import { inMemoryZooStorage, type ZooStorage } from "./zooStorage";

/** 7 November 2026, noon UTC: when the fake clock starts unless told otherwise. */
export const A_DAY = Date.UTC(2026, 10, 7, 12);

/** A clock that only moves when the test says so. */
export function fakeClock(start = A_DAY): Clock & { advance(ms: number): void } {
  let t = start;
  return {
    now: () => t,
    advance(ms: number) {
      t += ms;
    },
  };
}

/** A roundish drawing with plenty of ink. */
export const A_DRAWING: InkFacts = { width: 400, height: 400, inkAmount: 50_000, mainColor: "purple" };

/** Stands in for the kid's drawing as an image. The core only stores it. */
export const AN_IMAGE = new Blob(["a doodle"], { type: "image/png" });

export interface GameOptions {
  seed?: number;
  /** Pass the same storage to a second core to "reload the app". */
  storage?: ZooStorage;
  clock?: Clock;
}

/**
 * Builds a game core with a fake clock, seeded dice and in-memory Zoo
 * storage, so every run is the same. It opens in the Zoo, as the app does.
 */
export function newGame({ seed = 1, storage = inMemoryZooStorage(), clock = fakeClock() }: GameOptions = {}): GameCore {
  return createGameCore({ clock, dice: seededDice(seed), storage });
}

/** Builds a game core on the drawing screen: "Draw a Monster!" was just pressed. */
export function newRound(seed = 1, options: Omit<GameOptions, "seed"> = {}): GameCore {
  const core = newGame({ seed, ...options });
  if (!core.startRound()) throw new Error("The Round didn't start");
  return core;
}

export interface CatchOptions extends Omit<GameOptions, "seed"> {
  temperament?: Temperament;
  hardMode?: boolean;
}

/** A Round whose drawing is finished and brought to life, so its Catch has begun. */
export function buildCore(
  seed = 1,
  drawing: InkFacts = A_DRAWING,
  { temperament = "speedy", hardMode = false, ...game }: CatchOptions = {},
): GameCore {
  const core = newRound(seed, game);
  core.setHardMode(hardMode);
  if (!core.finishDrawing(drawing, AN_IMAGE)) throw new Error("The drawing wasn't accepted");
  core.placeEye({ x: 0.5, y: 0.3 });
  core.pickTemperament(temperament);
  if (!core.startCatch()) throw new Error("The Catch didn't start");
  return core;
}

/** Advances the core by `seconds`, in steps of about one 60 fps frame. */
export function runFor(core: GameCore, seconds: number, onFrame?: () => void): void {
  const dt = 1 / 60;
  for (let elapsed = 0; elapsed < seconds; elapsed += dt) {
    core.tick(dt);
    onFrame?.();
  }
}

/** Like `runFor`, but returns what each tick reported. */
export function tickResultsFor(core: GameCore, seconds: number): TickResult[] {
  const dt = 1 / 60;
  const results: TickResult[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += dt) results.push(core.tick(dt));
  return results;
}

/** Taps right on the middle of the Monster, wherever it is now. */
export function tapMonster(core: GameCore) {
  const { x, y } = core.monster();
  return core.bonk({ x, y });
}

/** A quick swipe from left to right straight through the middle of the Monster. */
export function swipeAcross(core: GameCore): Point[] {
  const { x, y, width } = core.monster();
  return [
    { x: x - width, y },
    { x, y },
    { x: x + width, y },
  ];
}

/** Ticks frame by frame until `done` holds. Fails the test if it never does. */
export function runUntil(core: GameCore, done: () => boolean, maxSeconds = 600): void {
  const dt = 1 / 60;
  for (let elapsed = 0; elapsed < maxSeconds; elapsed += dt) {
    if (done()) return;
    core.tick(dt);
  }
  throw new Error(`Still waiting after ${maxSeconds} s`);
}

/** How fast the Monster is moving right now, in pixels per second. */
export function speedOf(core: GameCore): number {
  const { vx, vy } = core.monster();
  return Math.hypot(vx, vy);
}

/** How far the Monster travels over `seconds`, in pixels, following its path frame by frame. */
export function groundCovered(core: GameCore, seconds: number): number {
  let { x, y } = core.monster();
  let total = 0;
  runFor(core, seconds, () => {
    const now = core.monster();
    total += Math.hypot(now.x - x, now.y - y);
    ({ x, y } = now);
  });
  return total;
}

/** Bonks the Monster until it's caught in its bubble, waiting out each Stunned. */
export function catchIt(core: GameCore): void {
  for (let taps = 0; !core.monster().caught; taps++) {
    if (taps > 50) throw new Error("Never caught");
    runUntil(core, () => !core.monster().stunned && !core.monster().flying);
    tapMonster(core);
  }
}
