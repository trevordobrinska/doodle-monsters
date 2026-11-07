import type { GameCore, Point, ZooMonsterView } from "../core/gameCore";
import { createPupil, drawGooglyEye, eyeRadius, springinessFor, type Pupil } from "./googlyEyes";
import { createLetterbox } from "./letterbox";

/**
 * Draws the Zoo's Habitat from the core's state: every Monster wandering
 * and hopping about, Googly Eyes jiggling, and watching the kid's finger
 * while they touch the screen. Holds no game rules.
 */
export interface HabitatRenderer {
  resize(): void;
  /** Turns a pointer position (CSS pixels, viewport) into arena coordinates. */
  toArena(clientX: number, clientY: number): Point;
  /**
   * Draws one frame. `dt` is seconds since the last frame. `finger` is where
   * the kid is touching, in arena coordinates, if they are.
   */
  draw(dt: number, finger: Point | undefined): void;
}

const GRASS = "#c8eba0";
const TUFT = "#8fcf63";

/** Wandering Monsters hop along: hops per second at strolling speed... */
const HOPS_PER_SECOND = 2.2;
/** ...how high, in arena units... */
const HOP_HEIGHT = 10;
/** ...and the speed (px/s) those are for. */
const STROLL_SPEED = 90;
/** Seconds a Monster takes to pop into the Habitat. */
const POP_IN_SECONDS = 0.5;
/** Tufts of grass dotted about, so the Habitat isn't bare: scattered evenly-ish, the same every time. */
const tuftsFor = ({ width, height }: { width: number; height: number }): Point[] =>
  Array.from({ length: 28 }, (_, i) => ({ x: 20 + ((i * 397) % (width - 40)), y: 20 + ((i * 211) % (height - 40)) }));


/** What the renderer remembers about each Monster between frames. Visual only. */
interface Seen {
  image?: ImageBitmap;
  pupils: Pupil[];
  hopPhase: number;
  shownFor: number;
}

export function createHabitatRenderer(canvas: HTMLCanvasElement, core: GameCore): HabitatRenderer {
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) throw new Error("2D canvas is not supported");
  const ctx: CanvasRenderingContext2D = maybeCtx;
  const { resize, toArena, begin } = createLetterbox(canvas, core.arena);
  const seen = new Map<string, Seen>();
  const tufts = tuftsFor(core.arena);

  function seenFor(m: ZooMonsterView): Seen {
    let s = seen.get(m.id);
    if (!s) {
      s = { pupils: m.eyes.map((_, i) => createPupil(springinessFor(i))), hopPhase: Math.random(), shownFor: 0 };
      seen.set(m.id, s);
      const fresh = s;
      // Decoding takes a moment; the Monster pops in once it's ready.
      createImageBitmap(m.image).then(
        (bitmap) => (fresh.image = bitmap),
        (error) => console.error(`Couldn't show ${m.name}'s drawing`, error),
      );
    }
    return s;
  }

  function draw(dt: number, finger: Point | undefined) {
    begin(ctx);
    const { width, height } = core.arena;
    ctx.fillStyle = GRASS;
    ctx.fillRect(0, 0, width, height);
    for (const t of tufts) drawTuft(t);

    // Nearer the bottom is nearer the kid, so drawn on top.
    const monsters = [...core.zoo()].sort((a, b) => a.y - b.y);
    for (const m of monsters) drawMonster(m, seenFor(m), dt, finger);
  }

  function drawTuft({ x, y }: Point) {
    ctx.strokeStyle = TUFT;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    // Three blades from a little patch of ground, curling outwards.
    for (const side of [-1, 0, 1]) {
      ctx.moveTo(x + side * 5, y);
      ctx.quadraticCurveTo(x + side * 6, y - 10, x + side * 11, y - 16 + Math.abs(side) * 4);
    }
    ctx.stroke();
  }

  function drawMonster(m: ZooMonsterView, s: Seen, dt: number, finger: Point | undefined) {
    if (!s.image) return;
    s.shownFor += dt;
    const strength = Math.min(1, Math.hypot(m.vx, m.vy) / STROLL_SPEED);
    s.hopPhase += dt * HOPS_PER_SECOND * strength;
    const hop = Math.abs(Math.sin(s.hopPhase * Math.PI)) * HOP_HEIGHT * strength;
    const at = { x: m.x, y: m.y - hop };
    // Pop in with a little overshoot.
    const t = Math.min(1, s.shownFor / POP_IN_SECONDS);
    const pop = t < 1 ? 1 - Math.cos(t * Math.PI * 2.5) * (1 - t) : 1;
    // Squashes as it lands each hop.
    const landing = 1 - Math.abs(Math.sin(s.hopPhase * Math.PI));
    const squash = landing ** 6 * 0.12 * strength;

    // Shadow stays on the ground while it hops.
    ctx.fillStyle = "rgba(43, 43, 64, 0.15)";
    ctx.beginPath();
    ctx.ellipse(m.x, m.y + m.height / 2, (m.width / 2) * 0.7 * pop, 8 * pop, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(at.x, at.y + m.height / 2);
    ctx.scale(pop * (1 + squash), pop * (1 - squash));
    ctx.translate(0, -m.height / 2);
    ctx.drawImage(s.image, -m.width / 2, -m.height / 2, m.width, m.height);
    const r = eyeRadius(m.width, m.height);
    m.eyes.forEach((eye, i) => {
      const ex = (eye.x - 0.5) * m.width;
      const ey = (eye.y - 0.5) * m.height;
      const pupil = s.pupils[i];
      pupil.follow(dt, { x: at.x + ex, y: at.y + ey }, finger);
      drawGooglyEye(ctx, ex, ey, r, { pupil: pupil.offset });
    });
    ctx.restore();
  }

  return { resize, toArena, draw };
}
