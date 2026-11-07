import type { Clock, Dice } from "./deps";

export interface Arena {
  readonly width: number;
  readonly height: number;
}

/** What the outside world can see of the blob. */
export interface BlobView {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface GameCore {
  readonly arena: Arena;
  /** Advances the game by `dt` seconds. */
  tick(dt: number): void;
  blob(): BlobView;
}

export interface GameCoreDeps {
  clock: Clock;
  dice: Dice;
}

/** Landscape Fire HD 8 resolution: the size every rule is designed against. */
const ARENA: Arena = { width: 1280, height: 800 };

const BLOB_RADIUS = 60;
const BLOB_SPEED = 320; // pixels per second

export function createGameCore({ dice }: GameCoreDeps): GameCore {
  const arena = ARENA;

  // Start in the middle, heading diagonally-ish (20°–70° off the axes)
  // so the blob reaches every wall rather than sliding along one.
  const angle = ((20 + dice.roll() * 50) * Math.PI) / 180;
  const randomSign = () => (dice.roll() < 0.5 ? -1 : 1);
  let x = arena.width / 2;
  let y = arena.height / 2;
  let vx = Math.cos(angle) * BLOB_SPEED * randomSign();
  let vy = Math.sin(angle) * BLOB_SPEED * randomSign();

  return {
    arena,
    tick(dt) {
      x += vx * dt;
      y += vy * dt;
      ({ pos: x, vel: vx } = bounce(x, vx, BLOB_RADIUS, arena.width - BLOB_RADIUS));
      ({ pos: y, vel: vy } = bounce(y, vy, BLOB_RADIUS, arena.height - BLOB_RADIUS));
    },
    blob: () => ({ x, y, radius: BLOB_RADIUS }),
  };
}

/**
 * Folds a position back between two walls, however far past them it went,
 * like a ray bouncing between two mirrors. `vel` is the velocity it moved
 * with this frame; the result's velocity is flipped if it ended on a leg
 * heading back the other way.
 */
function bounce(pos: number, vel: number, min: number, max: number) {
  const span = max - min;
  let offset = (pos - min) % (span * 2);
  if (offset < 0) offset += span * 2;
  return offset <= span
    ? { pos: min + offset, vel }
    : { pos: max - (offset - span), vel: -vel };
}
