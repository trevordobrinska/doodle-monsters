import type { Point } from "../core/gameCore";

/**
 * Turns raw pointer events on the canvas into taps and Flicks. This is the
 * only place that knows the thresholds between the two. It knows nothing about
 * the Monster: whether a tap or a swipe hit it is the core's call.
 *
 * A finger is judged when it lifts:
 * - it barely moved: a tap at the spot it lifted (where the Monster is now);
 * - it travelled far, quickly: a Flick along the path it drew;
 * - anything else (a slow drag): nothing.
 *
 * Thresholds are in CSS pixels, so they track finger size, not arena units.
 */
export interface GestureHandlers {
  onTap(at: Point): void;
  /** `path` is in arena coordinates, oldest point first. */
  onFlick(path: Point[]): void;
}

/** A finger that wanders less than this is still a tap. */
const TAP_MAX_TRAVEL = 24;
/** A swipe must cover at least this much ground to be a Flick... */
const FLICK_MIN_TRAVEL = 60;
/** ...within this long, from finger-down to finger-up. */
const FLICK_MAX_MS = 350;

interface Stroke {
  startedAt: number;
  /** Viewport points, for measuring travel in CSS pixels. */
  client: Point[];
}

export function listenForGestures(
  canvas: HTMLCanvasElement,
  toArena: (clientX: number, clientY: number) => Point,
  handlers: GestureHandlers,
): void {
  // One stroke per finger, so two fingers don't merge into one swipe.
  const strokes = new Map<number, Stroke>();

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    // Keep getting moves even if the swipe leaves the canvas.
    canvas.setPointerCapture(event.pointerId);
    strokes.set(event.pointerId, {
      startedAt: event.timeStamp,
      client: [{ x: event.clientX, y: event.clientY }],
    });
  });

  canvas.addEventListener("pointermove", (event) => {
    const stroke = strokes.get(event.pointerId);
    if (!stroke) return;
    // Coalesced events give the full path on fast swipes, not just one point per frame.
    const moves = event.getCoalescedEvents?.() ?? [event];
    for (const e of moves.length > 0 ? moves : [event]) stroke.client.push({ x: e.clientX, y: e.clientY });
  });

  canvas.addEventListener("pointerup", (event) => {
    const stroke = strokes.get(event.pointerId);
    strokes.delete(event.pointerId);
    if (!stroke) return;
    stroke.client.push({ x: event.clientX, y: event.clientY });

    const start = stroke.client[0];
    const travel = Math.max(...stroke.client.map((p) => Math.hypot(p.x - start.x, p.y - start.y)));
    const duration = event.timeStamp - stroke.startedAt;

    if (travel < TAP_MAX_TRAVEL) {
      handlers.onTap(toArena(event.clientX, event.clientY));
    } else if (travel >= FLICK_MIN_TRAVEL && duration <= FLICK_MAX_MS) {
      handlers.onFlick(stroke.client.map((p) => toArena(p.x, p.y)));
    }
  });

  const forget = (event: PointerEvent) => strokes.delete(event.pointerId);
  canvas.addEventListener("pointercancel", forget);
}
