import type { Arena, Point } from "../core/gameCore";

/**
 * Fits the arena onto a canvas as big as it'll go, centred, with bars where
 * the screen's shape differs. Shared by everything drawn in arena units.
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
  // Arena units → canvas pixels.
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  return {
    resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      scale = Math.min(canvas.width / arena.width, canvas.height / arena.height);
      offsetX = (canvas.width - arena.width * scale) / 2;
      offsetY = (canvas.height - arena.height * scale) / 2;
    },
    toArena(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const px = ((clientX - rect.left) / rect.width) * canvas.width;
      const py = ((clientY - rect.top) / rect.height) * canvas.height;
      return { x: (px - offsetX) / scale, y: (py - offsetY) / scale };
    },
    begin(ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    },
  };
}
