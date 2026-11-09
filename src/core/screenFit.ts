import type { Point } from "./gameCore";

/** A width and height, in CSS pixels or surface units. */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/** An axis-aligned rectangle: its top-left corner and its size. */
export interface Rect extends Size {
  readonly x: number;
  readonly y: number;
}

/**
 * Which way the app is drawn when the window is taller than wide, as a CSS
 * `rotate()` angle: -90 is a quarter turn anticlockwise, so the picture's top
 * runs down the upright screen's left edge. That's where the Fire tablet's
 * front camera sits when it's held upright the usual way (the browser's
 * portrait-primary on a landscape-first tablet), so turning the tablet a
 * quarter clockwise into camera-on-top landscape stands the picture upright.
 * To be confirmed on the tablet (landscape ticket 03); flip to 90 if it's wrong.
 */
export const TURN_DEGREES: -90 | 90 = -90;

/**
 * How the 1280×800 surface (the Arena, and the drawing surface) sits on the
 * window: the app laid out in a landscape frame (turned a quarter when the
 * window is tall), the surface scaled as big as it fits in that frame,
 * centred, with bars where the shapes differ.
 * The one place every "finger position → game position" sum comes from.
 */
export interface ScreenFit {
  /** Whether the app is drawn turned 90° (the window is taller than wide). */
  readonly turned: boolean;
  /** The landscape size the app lays itself out in, CSS pixels: the window, swapped when turned. */
  readonly frame: Size;
  /** Where the surface sits inside the frame, CSS pixels, bars excluded. */
  readonly rect: Rect;
  /** CSS pixels per surface unit. */
  readonly scale: number;
  /**
   * The CSS `transform` that puts the frame-sized app root on the window
   * (with `transform-origin: 0 0`). `"none"` when not turned.
   */
  readonly transform: string;
  /**
   * Turns a pointer position as the browser reports it (window CSS pixels,
   * never turned) into frame CSS pixels, undoing the turn.
   */
  toFrame(clientX: number, clientY: number): Point;
  /**
   * Turns a pointer position as the browser reports it (window CSS pixels)
   * into surface coordinates, undoing the turn first. A finger on a bar lands
   * outside 0..surface size.
   */
  toSurface(clientX: number, clientY: number): Point;
}

/**
 * Fits a surface onto the viewport (the window's size, never turned).
 * Pure: callers pass the viewport size in.
 */
export function fitScreen(viewport: Size, surface: Size): ScreenFit {
  const turned = viewport.height > viewport.width;
  const frame = turned
    ? { width: viewport.height, height: viewport.width }
    : { width: viewport.width, height: viewport.height };
  const scale = Math.min(frame.width / surface.width, frame.height / surface.height);
  const width = surface.width * scale;
  const height = surface.height * scale;
  const rect = { x: (frame.width - width) / 2, y: (frame.height - height) / 2, width, height };
  const turn = turned ? quarterTurn(viewport) : undefined;
  const toFrame = (clientX: number, clientY: number): Point =>
    turn ? turn.toFrame(clientX, clientY) : { x: clientX, y: clientY };
  return {
    turned,
    frame,
    rect,
    scale,
    transform: turn ? turn.transform : "none",
    toFrame,
    toSurface(clientX, clientY) {
      const p = toFrame(clientX, clientY);
      return { x: (p.x - rect.x) / scale, y: (p.y - rect.y) / scale };
    },
  };
}

/**
 * The quarter turn by TURN_DEGREES on a tall viewport, both ways round, from
 * the one branch so they can't drift apart: the CSS transform that puts the
 * frame on the viewport, and its undoing for a pointer.
 */
function quarterTurn(viewport: Size): { transform: string; toFrame(clientX: number, clientY: number): Point } {
  if (TURN_DEGREES === -90) {
    // The frame's top-left lands on the viewport's bottom-left; its x runs up the screen.
    return {
      transform: `translate(0px, ${viewport.height}px) rotate(-90deg)`,
      toFrame: (clientX, clientY) => ({ x: viewport.height - clientY, y: clientX }),
    };
  }
  // The frame's top-left lands on the viewport's top-right; its x runs down the screen.
  return {
    transform: `translate(${viewport.width}px, 0px) rotate(90deg)`,
    toFrame: (clientX, clientY) => ({ x: clientY, y: viewport.width - clientX }),
  };
}
