import type { Arena, Point } from "../core/gameCore";
import { fitScreen, type ScreenFit } from "../core/screenFit";
import { viewportSize } from "./viewport";

/**
 * Fits the arena onto a canvas as big as it'll go, centred, with bars where
 * the screen's shape differs. Shared by everything drawn in arena units (the
 * drawing surface is the Arena's size, so the drawing screen uses it too).
 * The sums come from the screen fit; this adds the canvas and its pixel ratio.
 */
export interface Letterbox {
  /** Matches the canvas backing store to the frame and re-fits. Call on resize. */
  resize(): void;
  /** Turns a pointer position (CSS pixels, viewport) into arena coordinates. */
  toArena(clientX: number, clientY: number): Point;
  /** Clears the canvas and sets `ctx` up to draw in arena units. */
  begin(ctx: CanvasRenderingContext2D): void;
  /**
   * Sets `ctx` up to draw in arena units without clearing anything. For a
   * context the same size as the canvas, such as an offscreen copy of it.
   */
  inArenaUnits(ctx: CanvasRenderingContext2D): void;
}

export function createLetterbox(canvas: HTMLCanvasElement, arena: Arena): Letterbox {
  let fit: ScreenFit = fitScreen(viewportSize(), arena);
  // Arena units → canvas backing-store pixels (the fit's CSS pixels × dpr).
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  const inArenaUnits = (ctx: CanvasRenderingContext2D) => ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  return {
    resize() {
      const dpr = window.devicePixelRatio || 1;
      fit = fitScreen(viewportSize(), arena);
      canvas.width = Math.round(fit.frame.width * dpr);
      canvas.height = Math.round(fit.frame.height * dpr);
      scale = fit.scale * dpr;
      offsetX = fit.rect.x * dpr;
      offsetY = fit.rect.y * dpr;
    },
    toArena(clientX, clientY) {
      return fit.toSurface(clientX, clientY);
    },
    begin(ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      inArenaUnits(ctx);
    },
    inArenaUnits,
  };
}
