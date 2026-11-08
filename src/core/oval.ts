import type { Point } from "./gameCore";

/**
 * Where a Monster, or something drawn like one, is: the oval filling a box
 * of this size, centred on (x, y), in arena units. It's what a tap can hit.
 */
export interface Oval {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Taps this far outside the Monster's edge still land, for small fingers. */
const TOUCH_SLOP = 16;

/**
 * Whether a tap (one point) or a swipe lands on the oval, with TOUCH_SLOP of
 * slack all round. Squashing the arena so the oval becomes a unit circle
 * turns this into a circle test.
 */
export function crossesOval(path: readonly Point[], oval: Oval): boolean {
  const rx = oval.width / 2 + TOUCH_SLOP;
  const ry = oval.height / 2 + TOUCH_SLOP;
  const squashed = path.map((p) => ({ x: (p.x - oval.x) / rx, y: (p.y - oval.y) / ry }));
  return crossesCircle(squashed, { x: 0, y: 0 }, 1);
}

/** Whether a tap lands on the oval. */
export function onOval(at: Point, oval: Oval): boolean {
  return crossesOval([at], oval);
}

/** Whether any leg of the path comes within `radius` of `centre`. */
function crossesCircle(path: readonly Point[], centre: Point, radius: number): boolean {
  if (path.length === 1) return Math.hypot(path[0].x - centre.x, path[0].y - centre.y) <= radius;
  for (let i = 1; i < path.length; i++) {
    if (distanceToSegment(centre, path[i - 1], path[i]) <= radius) return true;
  }
  return false;
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
