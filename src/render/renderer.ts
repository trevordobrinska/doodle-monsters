import type { BlobView, GameCore } from "../core/gameCore";

/**
 * Draws the core's state onto a canvas. Holds no game rules: everything it
 * shows comes from asking the core.
 */
export interface Renderer {
  /** Matches the canvas backing store to its on-screen size. Call on resize. */
  resize(): void;
  draw(): void;
}

export function createRenderer(canvas: HTMLCanvasElement, core: GameCore): Renderer {
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) throw new Error("2D canvas is not supported");
  const ctx: CanvasRenderingContext2D = maybeCtx;

  // Arena units → screen pixels. The arena is letterboxed to fit the screen.
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    const { width, height } = core.arena;
    scale = Math.min(canvas.width / width, canvas.height / height);
    offsetX = (canvas.width - width * scale) / 2;
    offsetY = (canvas.height - height * scale) / 2;
  }

  function draw() {
    const { width, height } = core.arena;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    // Arena floor
    ctx.fillStyle = "#fff8e7";
    ctx.fillRect(0, 0, width, height);

    drawPlaceholderBlob(ctx, core.blob());
  }

  return { resize, draw };
}

function drawPlaceholderBlob(
  ctx: CanvasRenderingContext2D,
  { x, y, radius }: BlobView,
) {
  ctx.fillStyle = "#7ed957";
  ctx.strokeStyle = "#2b2b40";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Two placeholder eyes so it reads as a creature.
  for (const side of [-1, 1]) {
    const ex = x + side * radius * 0.35;
    const ey = y - radius * 0.2;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex, ey, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#2b2b40";
    ctx.beginPath();
    ctx.arc(ex, ey, radius * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
}
