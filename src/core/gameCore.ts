import type { Clock, Dice } from "./deps";

export interface Arena {
  readonly width: number;
  readonly height: number;
}

/** What the outside world can see of the Monster. */
export interface MonsterView {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  /** Velocity in pixels per second. Zero while Stunned. */
  readonly vx: number;
  readonly vy: number;
  /** Steps of Dizzy built up so far. */
  readonly dizzy: number;
  /** Steps of Dizzy that make the Monster fully Dizzy. */
  readonly fullDizzy: number;
  readonly stunned: boolean;
  /** Fully Dizzy (spiral eyes): one more tap catches it. */
  readonly readyToCatch: boolean;
  /** Worn out after a long Catch, so it moves slower. */
  readonly sleepy: boolean;
  /** Caught in its bubble. The Catch is over. */
  readonly caught: boolean;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** What a tap did: a Bonk, a "boing" on a Stunned Monster, a catch, or nothing. */
export type TapResult = "bonk" | "boing" | "caught" | "miss";

export interface GameCore {
  readonly arena: Arena;
  /** Advances the game by `dt` seconds. */
  tick(dt: number): void;
  monster(): MonsterView;
  /** A tap at a point in arena coordinates. The core decides whether it hit. */
  bonk(at: Point): TapResult;
}

export interface GameCoreDeps {
  clock: Clock;
  dice: Dice;
}

/** Landscape Fire HD 8 resolution: the size every rule is designed against. */
const ARENA: Arena = { width: 1280, height: 800 };

const MONSTER_RADIUS = 60;
const MONSTER_SPEED = 320; // pixels per second
/** Taps this far outside the Monster's edge still land, for small fingers. */
const TOUCH_SLOP = 16;
const STUNNED_SECONDS = 1;
const FULL_DIZZY = 6;
/** Extra speed right after a dash, as a fraction of normal speed. */
const DASH_BOOST = 0.8;
/** How long the dash boost takes to fade back to normal speed. */
const DASH_SECONDS = 1.5;
/** Dizzy starts draining after this long without a Bonk... */
const DRAIN_DELAY_SECONDS = 3;
/** ...and then loses one step this often. */
const DRAIN_STEP_SECONDS = 1.5;
/** A Catch can't fail: after this long the Monster gets sleepy... */
const SLEEPY_AFTER_SECONDS = 120;
/** ...and over this long slows down to this fraction of its speed. */
const SLEEPY_SLOWDOWN_SECONDS = 10;
const SLEEPY_SPEED = 0.5;

export function createGameCore({ dice }: GameCoreDeps): GameCore {
  const arena = ARENA;

  // Start in the middle, heading diagonally-ish (20°–70° off the axes)
  // so the Monster reaches every wall rather than sliding along one.
  const angle = ((20 + dice.roll() * 50) * Math.PI) / 180;
  const randomSign = () => (dice.roll() < 0.5 ? -1 : 1);
  let x = arena.width / 2;
  let y = arena.height / 2;
  // Unit vector the Monster is heading along.
  let dirX = Math.cos(angle) * randomSign();
  let dirY = Math.sin(angle) * randomSign();
  let dizzy = 0;
  let stunnedLeft = 0; // seconds of Stunned still to go
  let dashLeft = 0; // seconds of dash boost still to go
  let drainIn = 0; // seconds until Dizzy next loses a step
  let caught = false;
  let catchSeconds = 0; // how long this Catch has been going
  const readyToCatch = () => dizzy >= FULL_DIZZY;

  function speed() {
    if (stunnedLeft > 0 || caught) return 0;
    return MONSTER_SPEED * (1 + DASH_BOOST * (dashLeft / DASH_SECONDS)) * sleepiness();
  }

  /** 1 while wide awake, easing down to SLEEPY_SPEED once the Catch runs long. */
  function sleepiness() {
    const drowsy = (catchSeconds - SLEEPY_AFTER_SECONDS) / SLEEPY_SLOWDOWN_SECONDS;
    return 1 - (1 - SLEEPY_SPEED) * Math.min(1, Math.max(0, drowsy));
  }

  function dashOff() {
    const dashAngle = dice.roll() * Math.PI * 2;
    dirX = Math.cos(dashAngle);
    dirY = Math.sin(dashAngle);
    dashLeft = DASH_SECONDS;
  }

  function drainDizzy(dt: number) {
    // A fully Dizzy Monster waits for its catching tap rather than recovering.
    if (dizzy === 0 || readyToCatch()) return;
    drainIn -= dt;
    while (drainIn <= 0 && dizzy > 0) {
      dizzy -= 1;
      drainIn += DRAIN_STEP_SECONDS;
    }
  }

  return {
    arena,
    tick(dt) {
      if (caught) return;
      catchSeconds += dt;
      drainDizzy(dt);
      if (stunnedLeft > 0) {
        stunnedLeft = Math.max(0, stunnedLeft - dt);
        if (stunnedLeft === 0) dashOff();
        return;
      }
      const frameSpeed = speed();
      dashLeft = Math.max(0, dashLeft - dt);
      x += dirX * frameSpeed * dt;
      y += dirY * frameSpeed * dt;
      ({ pos: x, dir: dirX } = bounce(x, dirX, MONSTER_RADIUS, arena.width - MONSTER_RADIUS));
      ({ pos: y, dir: dirY } = bounce(y, dirY, MONSTER_RADIUS, arena.height - MONSTER_RADIUS));
    },
    monster: () => ({
      x,
      y,
      radius: MONSTER_RADIUS,
      vx: dirX * speed(),
      vy: dirY * speed(),
      dizzy,
      fullDizzy: FULL_DIZZY,
      stunned: stunnedLeft > 0,
      readyToCatch: readyToCatch(),
      sleepy: catchSeconds >= SLEEPY_AFTER_SECONDS,
      caught,
    }),
    bonk(at) {
      if (caught || Math.hypot(at.x - x, at.y - y) > MONSTER_RADIUS + TOUCH_SLOP) return "miss";
      if (stunnedLeft > 0) return "boing";
      if (readyToCatch()) {
        caught = true;
        return "caught";
      }
      dizzy += 1;
      drainIn = DRAIN_DELAY_SECONDS;
      stunnedLeft = STUNNED_SECONDS;
      return "bonk";
    },
  };
}

/**
 * Folds a position back between two walls, however far past them it went,
 * like a ray bouncing between two mirrors. `dir` is the direction (sign) it
 * moved in this frame; the result's direction is flipped if it ended on a
 * leg heading back the other way.
 */
function bounce(pos: number, dir: number, min: number, max: number) {
  const span = max - min;
  let offset = (pos - min) % (span * 2);
  if (offset < 0) offset += span * 2;
  return offset <= span
    ? { pos: min + offset, dir }
    : { pos: max - (offset - span), dir: -dir };
}
