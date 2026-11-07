import { createGameCore, type GameCore, type InkFacts, type Point, type TickResult } from "./gameCore";
import { seededDice, type Clock } from "./deps";

/** A clock that only moves when the test says so. */
export function fakeClock(start = 0): Clock & { advance(ms: number): void } {
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

/** Builds a game core with a fake clock and seeded dice, so every run is the same. */
export function newRound(seed = 1): GameCore {
  return createGameCore({ clock: fakeClock(), dice: seededDice(seed) });
}

/** A Round whose drawing is finished and brought to life, so its Catch has begun. */
export function buildCore(seed = 1, drawing: InkFacts = A_DRAWING): GameCore {
  const core = newRound(seed);
  if (!core.finishDrawing(drawing)) throw new Error("The drawing wasn't accepted");
  core.placeEye({ x: 0.5, y: 0.3 });
  core.pickTemperament("speedy");
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
