import { createGameCore, type GameCore } from "./gameCore";
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

/** Builds a game core with a fake clock and seeded dice, so every run is the same. */
export function buildCore(seed = 1): GameCore {
  return createGameCore({ clock: fakeClock(), dice: seededDice(seed) });
}

/** Advances the core by `seconds`, in steps of about one 60 fps frame. */
export function runFor(core: GameCore, seconds: number, onFrame?: () => void): void {
  const dt = 1 / 60;
  for (let elapsed = 0; elapsed < seconds; elapsed += dt) {
    core.tick(dt);
    onFrame?.();
  }
}

/** Taps right on the middle of the Monster, wherever it is now. */
export function tapMonster(core: GameCore) {
  const { x, y } = core.monster();
  return core.bonk({ x, y });
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
