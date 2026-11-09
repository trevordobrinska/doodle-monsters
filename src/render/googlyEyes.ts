import type { Point } from "../core/gameCore";

/**
 * Googly Eyes as they look: a white ball with a loose black pupil that
 * rattles around inside. Shared by the Bring to life screen and the Catch,
 * so an eye looks the same size in both. Visual only, no game rules.
 */

/** An eye's radius, as a fraction of the Monster's longest side. */
const EYE_SIZE = 0.12;
/** The pupil's radius, as a fraction of the eye's. */
const PUPIL_SIZE = 0.5;
/** How far the pupil's centre can roll from the eye's centre, as a fraction of the eye's radius. */
const ROLL_ROOM = 1 - PUPIL_SIZE - 0.08;

const INK = "#2b2b40";
const LID = "#d9d4e8";

/** Pull on the pupil, in eye radii per second²: it settles at the bottom, like a real googly eye. */
const GRAVITY = 14;
/** How much of its speed the pupil keeps each second. */
const DAMPING = 0.25;
/** How much of its speed the pupil keeps bouncing off the inside of the eye. */
const RESTITUTION = 0.55;
/** A change in the eye's velocity (px/s) times this is the kick the pupil gets (eye radii/s). */
const KICK = 0.012;
const MAX_PUPIL_SPEED = 14;
/** Pull towards a finger being watched, in eye radii per second² per eye radius away. */
const LOOK_PULL = 90;
/** How close the finger has to be (in the same units as the eye's position) before the pupil looks less far round. */
const LOOK_NEAR = 60;

/** Each eye of a face gets a slightly different springiness (0.8–1.2), so they don't jiggle in step. */
export const springinessFor = (eyeIndex: number) => 0.8 + ((eyeIndex * 0.37) % 0.4);

/** Seconds a newly stuck eye takes to pop on. */
const POP_SECONDS = 0.25;

/**
 * How big a newly stuck eye is drawn, 0 → 1 with a little overshoot, given
 * the seconds since it was stuck on.
 */
export function popInScale(secondsSinceStuck: number): number {
  // A frame's timestamp can be just before the tap that stuck the eye on, so
  // clamp below as well as above. Floor at zero too, since the curve dips a
  // hair under zero at the start and the canvas throws on a negative radius.
  const t = Math.min(1, Math.max(0, secondsSinceStuck / POP_SECONDS));
  const s = 1.7;
  const u = t - 1;
  return Math.max(0, 1 + u * u * ((s + 1) * u + s));
}

export function eyeRadius(monsterWidth: number, monsterHeight: number): number {
  return EYE_SIZE * Math.max(monsterWidth, monsterHeight);
}

/**
 * One pupil rattling inside its eye. Its offset is in eye radii from the
 * eye's centre. `springiness` varies each eye a little so a face's eyes
 * don't all jiggle in step.
 */
export interface Pupil {
  /**
   * Advances the pupil, given where its eye is now (in arena units, or
   * screen pixels scaled to match). Whenever the eye speeds up, slows down or
   * turns, the loose pupil is left behind and rattles around.
   *
   * Given `lookAt` (a finger, in the same units), the pupil rolls round to
   * look at it instead of settling at the bottom, still jiggling as it goes.
   */
  follow(dt: number, eyeAt: Point, lookAt?: Point): void;
  readonly offset: Point;
}

export function createPupil(springiness = 1): Pupil {
  const offset = { x: 0, y: ROLL_ROOM }; // resting at the bottom
  let vx = 0;
  let vy = 0;
  let lastAt: Point | undefined;
  let lastVelocity: Point = { x: 0, y: 0 };
  return {
    offset,
    follow(dt, eyeAt, lookAt) {
      if (dt <= 0) return;
      const velocity = lastAt ? { x: (eyeAt.x - lastAt.x) / dt, y: (eyeAt.y - lastAt.y) / dt } : lastVelocity;
      const kick = { x: velocity.x - lastVelocity.x, y: velocity.y - lastVelocity.y };
      lastAt = eyeAt;
      lastVelocity = velocity;
      // The eye moved, so the loose pupil gets left behind.
      vx -= kick.x * KICK * springiness;
      vy -= kick.y * KICK * springiness;
      if (lookAt) {
        const dx = lookAt.x - eyeAt.x;
        const dy = lookAt.y - eyeAt.y;
        const away = Math.hypot(dx, dy);
        // Right under the eye, the pupil looks straight out (the middle); further off, round to the edge.
        const reach = away === 0 ? 0 : (ROLL_ROOM * Math.min(1, away / LOOK_NEAR)) / away;
        vx += (dx * reach - offset.x) * LOOK_PULL * dt;
        vy += (dy * reach - offset.y) * LOOK_PULL * dt;
      } else {
        vy += GRAVITY * dt;
      }
      const keep = DAMPING ** dt;
      vx *= keep;
      vy *= keep;
      const speed = Math.hypot(vx, vy);
      if (speed > MAX_PUPIL_SPEED) {
        vx *= MAX_PUPIL_SPEED / speed;
        vy *= MAX_PUPIL_SPEED / speed;
      }
      offset.x += vx * dt;
      offset.y += vy * dt;
      // Bounce off the inside of the eye.
      const out = Math.hypot(offset.x, offset.y);
      if (out > ROLL_ROOM) {
        const nx = offset.x / out;
        const ny = offset.y / out;
        offset.x = nx * ROLL_ROOM;
        offset.y = ny * ROLL_ROOM;
        const along = vx * nx + vy * ny;
        if (along > 0) {
          vx -= (1 + RESTITUTION) * along * nx;
          vy -= (1 + RESTITUTION) * along * ny;
        }
      }
    },
  };
}

export interface EyeLook {
  /** Pupil position from the eye's centre, in eye radii. */
  pupil: Point;
  /** Spiral eyes (fully Dizzy): the spiral's rotation, in radians. Replaces the pupil. */
  spiral?: number;
  /** Droopy eyelids. */
  sleepy?: boolean;
  /** 0–1, for an eye being dragged off the drawing. */
  alpha?: number;
}

export function drawGooglyEye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, look: EyeLook): void {
  ctx.save();
  ctx.globalAlpha *= look.alpha ?? 1;
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.strokeStyle = INK;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (look.spiral !== undefined) {
    drawSpiral(ctx, x, y, r * 0.85, look.spiral);
  } else {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x + look.pupil.x * r, y + look.pupil.y * r, r * PUPIL_SIZE, 0, Math.PI * 2);
    ctx.fill();
    // A little shine, so it reads as a shiny plastic eye.
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(x - r * 0.38, y - r * 0.4, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    if (look.sleepy) {
      ctx.fillStyle = LID;
      ctx.beginPath();
      ctx.arc(x, y, r + ctx.lineWidth / 2, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x + r, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawSpiral(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const turns = 3;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const a = t * turns * Math.PI * 2;
    const rr = t * r;
    if (i === 0) ctx.moveTo(0, 0);
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.stroke();
  ctx.restore();
}
