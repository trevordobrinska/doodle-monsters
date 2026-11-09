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
 * How the 1280×800 surface (the Arena, and the drawing surface) sits on the
 * window: scaled as big as it fits, centred, with bars where the shapes differ.
 * The one place every "finger position → game position" sum comes from.
 */
export interface ScreenFit {
  /** Whether the app is drawn turned 90° (the window is taller than wide). Not yet: always false. */
  readonly turned: boolean;
  /** The landscape size the app lays itself out in, CSS pixels. For now, the window. */
  readonly frame: Size;
  /** Where the surface sits inside the frame, CSS pixels, bars excluded. */
  readonly rect: Rect;
  /** CSS pixels per surface unit. */
  readonly scale: number;
  /**
   * Turns a pointer position as the browser reports it (window CSS pixels)
   * into surface coordinates. A finger on a bar lands outside 0..surface size.
   */
  toSurface(clientX: number, clientY: number): Point;
}

/** Fits a surface onto a window. Pure: callers pass the window size in. */
export function fitScreen(window: Size, surface: Size): ScreenFit {
  const frame = { width: window.width, height: window.height };
  const scale = Math.min(frame.width / surface.width, frame.height / surface.height);
  const width = surface.width * scale;
  const height = surface.height * scale;
  const rect = { x: (frame.width - width) / 2, y: (frame.height - height) / 2, width, height };
  return {
    turned: false,
    frame,
    rect,
    scale,
    toSurface: (clientX, clientY) => ({ x: (clientX - rect.x) / scale, y: (clientY - rect.y) / scale }),
  };
}
