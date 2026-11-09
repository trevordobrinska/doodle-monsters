import type { Point } from "../core/gameCore";
import {
  BRUSHES,
  COLORS,
  SURFACE,
  createDrawing,
  paintStroke,
  type Brush,
  type Color,
  type Drawing,
  type FinishedDrawing,
  type Stroke,
} from "./drawing";
import { createLetterbox } from "../render/letterbox";

/**
 * The full-screen drawing screen: a canvas to draw on with one finger, a
 * toolbar of colors, brushes, undo and start over, and a "Done" button.
 * No eraser and no timer, on purpose. Whether there's enough ink for "Done"
 * is the core's rule, asked through `enoughInk`.
 */
export interface DrawScreenOptions {
  enoughInk(inkAmount: number): boolean;
  onDone(drawing: FinishedDrawing): void;
}

export interface DrawScreen {
  /** Shows the screen with a fresh, empty drawing. */
  show(): void;
  hide(): void;
}

const PAPER = "#ffffff";
/** How long "Start over?" waits for its second tap. */
const CONFIRM_MS = 3000;

export function createDrawScreen(root: HTMLElement, options: DrawScreenOptions): DrawScreen {
  root.innerHTML = `
    <canvas class="paper"></canvas>
    <div class="toolbar">
      <div class="colors"></div>
      <div class="brushes">
        <button class="brush" data-brush="thin" aria-label="Thin brush"><span></span></button>
        <button class="brush" data-brush="thick" aria-label="Thick brush"><span></span></button>
      </div>
      <button class="tool undo">↶ Undo</button>
      <button class="tool start-over">Start over</button>
    </div>
    <button class="done">Done ✓</button>
  `;
  const canvas = root.querySelector<HTMLCanvasElement>(".paper")!;
  const ctx = canvas.getContext("2d")!;
  const colorsBox = root.querySelector<HTMLElement>(".colors")!;
  const undoButton = root.querySelector<HTMLButtonElement>(".undo")!;
  const startOverButton = root.querySelector<HTMLButtonElement>(".start-over")!;
  const doneButton = root.querySelector<HTMLButtonElement>(".done")!;
  const brushButtons = [...root.querySelectorAll<HTMLButtonElement>(".brush")];

  let drawing: Drawing = createDrawing();
  let color: Color = COLORS.find((c) => c.name === "purple")!;
  let brush: Brush = "thick";
  /** The stroke the finger is drawing right now, and which finger. */
  let current: { stroke: Stroke; pointerId: number } | undefined;
  /** Finished strokes, painted once so each frame only has to add the current one. */
  const committed = document.createElement("canvas");
  let confirmTimer: number | undefined;

  /** Where the surface sits on the screen, letterboxed like the arena. Re-fitted on every resize. */
  const letterbox = createLetterbox(canvas, SURFACE);

  for (const c of COLORS) {
    const swatch = document.createElement("button");
    swatch.className = "swatch";
    swatch.style.background = c.hex;
    swatch.setAttribute("aria-label", c.name);
    swatch.addEventListener("click", () => {
      color = c;
      updateToolbar();
    });
    colorsBox.append(swatch);
  }
  const swatches = [...colorsBox.children] as HTMLElement[];

  for (const b of brushButtons) {
    const kind = b.dataset.brush as Brush;
    const dot = b.querySelector("span")!;
    dot.style.width = dot.style.height = `${BRUSHES[kind] * 0.75}px`;
    b.addEventListener("click", () => {
      brush = kind;
      updateToolbar();
    });
  }

  // Undo and start over wait until no finger is drawing, so they never pull
  // the stroke out from under it.
  undoButton.addEventListener("click", () => {
    if (current) return;
    drawing.undo();
    repaintCommitted();
  });

  // Start over wipes everything, so it asks once: tap again to be sure.
  startOverButton.addEventListener("click", () => {
    if (current) return;
    if (confirmTimer === undefined) {
      startOverButton.textContent = "Sure? Tap again";
      startOverButton.classList.add("confirming");
      confirmTimer = window.setTimeout(resetStartOver, CONFIRM_MS);
      return;
    }
    resetStartOver();
    drawing.startOver();
    repaintCommitted();
  });

  doneButton.addEventListener("click", () => {
    if (current || !options.enoughInk(drawing.inkAmount())) return;
    options.onDone(drawing.finish());
  });

  function resetStartOver() {
    window.clearTimeout(confirmTimer);
    confirmTimer = undefined;
    startOverButton.textContent = "Start over";
    startOverButton.classList.remove("confirming");
  }

  function updateToolbar() {
    swatches.forEach((s, i) => s.classList.toggle("chosen", COLORS[i] === color));
    for (const b of brushButtons) {
      b.classList.toggle("chosen", b.dataset.brush === brush);
      b.querySelector("span")!.style.background = color.hex;
    }
    const hasInk = drawing.strokes.length > 0;
    undoButton.disabled = !hasInk;
    startOverButton.disabled = !hasInk;
    doneButton.disabled = !options.enoughInk(drawing.inkAmount());
  }

  function resize() {
    // The canvas fills the frame (the app root), like the game canvas.
    letterbox.resize();
    committed.width = canvas.width;
    committed.height = canvas.height;
    repaintCommitted();
  }

  function toSurface(event: PointerEvent): Point {
    // Through the screen fit, never the canvas's on-screen rectangle: once the
    // app is turned that's the rotated bounding box.
    const p = letterbox.toArena(event.clientX, event.clientY);
    // Ink can't land outside the surface (in the letterbox margins), where it
    // would count as ink but never show up in the Monster.
    return { x: clamp(p.x, 0, SURFACE.width), y: clamp(p.y, 0, SURFACE.height) };
  }

  /** Repaints every finished stroke. Needed after undo, start over or a resize. */
  function repaintCommitted() {
    const c = committed.getContext("2d")!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#e9e4d8"; // outside the drawing surface
    c.fillRect(0, 0, committed.width, committed.height);
    letterbox.inArenaUnits(c);
    c.fillStyle = PAPER;
    c.fillRect(0, 0, SURFACE.width, SURFACE.height);
    c.save();
    c.beginPath();
    c.rect(0, 0, SURFACE.width, SURFACE.height);
    c.clip();
    for (const s of drawing.strokes) if (s !== current?.stroke) paintStroke(c, s);
    c.restore();
    updateToolbar();
    requestPaint();
  }

  let paintQueued = false;
  function requestPaint() {
    if (paintQueued) return;
    paintQueued = true;
    requestAnimationFrame(() => {
      paintQueued = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(committed, 0, 0);
      if (current) {
        letterbox.inArenaUnits(ctx);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, SURFACE.width, SURFACE.height);
        ctx.clip();
        paintStroke(ctx, current.stroke);
        ctx.restore();
      }
    });
  }

  // One finger draws at a time; a second finger (or a resting palm) is ignored.
  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (current) return;
    resetStartOver();
    canvas.setPointerCapture(event.pointerId);
    current = { stroke: drawing.begin(toSurface(event), color, brush), pointerId: event.pointerId };
    requestPaint();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (current?.pointerId !== event.pointerId) return;
    // Coalesced events give every sample of a fast stroke, for smooth lines.
    const moves = event.getCoalescedEvents?.() ?? [];
    for (const e of moves.length > 0 ? moves : [event]) current.stroke.points.push(toSurface(e));
    requestPaint();
  });

  const endStroke = (event: PointerEvent) => {
    if (current?.pointerId !== event.pointerId) return;
    current = undefined;
    repaintCommitted();
  };
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);

  window.addEventListener("resize", () => {
    if (!root.hidden) resize();
  });

  return {
    show() {
      drawing = createDrawing();
      current = undefined;
      resetStartOver();
      root.hidden = false;
      resize();
    },
    hide() {
      root.hidden = true;
    },
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
