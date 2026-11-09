import type { Arena, Point } from "../core/gameCore";
import { fitScreen, type ScreenFit, type Size } from "../core/screenFit";

/**
 * The window's size in CSS pixels: the box the game canvas fills, and what
 * the screen fit is given.
 */
export function windowSize(): Size {
  const { clientWidth, clientHeight } = document.documentElement;
  return { width: clientWidth, height: clientHeight };
}

/**
 * Fits the arena onto a canvas as big as it'll go, centred, with bars where
 * the screen's shape differs. Shared by everything drawn in arena units.
 * The sums come from the screen fit; this adds the canvas and its pixel ratio.
 */
export interface Letterbox {
  /** Matches the canvas backing store to its on-screen size. Call on resize. */
  resize(): void;
  /** Turns a pointer position (CSS pixels, viewport) into arena coordinates. */
  toArena(clientX: number, clientY: number): Point;
  /** Clears the canvas and sets `ctx` up to draw in arena units. */
  begin(ctx: CanvasRenderingContext2D): void;
}

export function createLetterbox(canvas: HTMLCanvasElement, arena: Arena): Letterbox {
  let fit: ScreenFit = fitScreen(windowSize(), arena);
  // Arena units → canvas backing-store pixels (the fit's CSS pixels × dpr).
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  return {
    resize() {
      const dpr = window.devicePixelRatio || 1;
      fit = fitScreen(windowSize(), arena);
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
      ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    },
  };
}
