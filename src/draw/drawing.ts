import type { InkFacts, Point } from "../core/gameCore";

/**
 * A drawing in progress: the strokes a kid has made, plus the sums the
 * drawing screen needs (how much ink, which color has most) and the final
 * processing into a Monster image. No DOM here beyond painting onto a
 * canvas context it's handed, so the screen can redraw it any time.
 *
 * Everything is in drawing units: the drawing surface is always
 * SURFACE.width × SURFACE.height, letterboxed onto the screen, so brush
 * sizes and ink amounts mean the same on every device.
 */

export const SURFACE = { width: 1280, height: 800 } as const;

/** About 8 bright colors. Names are what the core (and later the Bio) hears. */
export const COLORS = [
  { name: "red", hex: "#ff4d4d" },
  { name: "orange", hex: "#ff9f1c" },
  { name: "yellow", hex: "#ffd23f" },
  { name: "green", hex: "#3ec300" },
  { name: "blue", hex: "#3a86ff" },
  { name: "purple", hex: "#9b5de5" },
  { name: "pink", hex: "#ff70a6" },
  { name: "black", hex: "#2b2b40" },
] as const;

export type Color = (typeof COLORS)[number];

/** Brush widths in drawing units. */
export const BRUSHES = { thin: 12, thick: 36 } as const;

export type Brush = keyof typeof BRUSHES;

/** Longest side of a finished Monster image, in image pixels. Keeps images modest. */
const MONSTER_IMAGE_SIZE = 256;

export interface Stroke {
  readonly color: Color;
  readonly width: number;
  readonly points: Point[];
}

export interface FinishedDrawing {
  /** The drawing trimmed to its ink, on a transparent background, at the standard image size. */
  readonly image: HTMLCanvasElement;
  readonly ink: InkFacts;
}

export function createDrawing() {
  const strokes: Stroke[] = [];

  /** Rough area a stroke covers: its length times its width, plus round end caps. */
  function inkOf(stroke: Stroke): number {
    let length = 0;
    for (let i = 1; i < stroke.points.length; i++) {
      const a = stroke.points[i - 1];
      const b = stroke.points[i];
      length += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return length * stroke.width + Math.PI * (stroke.width / 2) ** 2;
  }

  function inkAmount(): number {
    return strokes.reduce((sum, s) => sum + inkOf(s), 0);
  }

  /** The color with the most ink. Overlaps count twice, which is close enough. */
  function mainColor(): Color | undefined {
    const byColor = new Map<Color, number>();
    for (const s of strokes) byColor.set(s.color, (byColor.get(s.color) ?? 0) + inkOf(s));
    let best: Color | undefined;
    for (const [color, ink] of byColor) if (best === undefined || ink > byColor.get(best)!) best = color;
    return best;
  }

  /** The box around all the ink, clipped to the drawing surface. */
  function inkBounds() {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const s of strokes) {
      const r = s.width / 2;
      for (const p of s.points) {
        left = Math.min(left, p.x - r);
        top = Math.min(top, p.y - r);
        right = Math.max(right, p.x + r);
        bottom = Math.max(bottom, p.y + r);
      }
    }
    left = Math.max(0, left);
    top = Math.max(0, top);
    right = Math.min(SURFACE.width, right);
    bottom = Math.min(SURFACE.height, bottom);
    return { left, top, width: right - left, height: bottom - top };
  }

  return {
    strokes: strokes as readonly Stroke[],
    /** Starts a stroke at a point. Keep adding to the returned stroke's points as the finger moves. */
    begin(at: Point, color: Color, brush: Brush): Stroke {
      const stroke: Stroke = { color, width: BRUSHES[brush], points: [at] };
      strokes.push(stroke);
      return stroke;
    },
    undo() {
      strokes.pop();
    },
    startOver() {
      strokes.length = 0;
    },
    inkAmount,
    /**
     * Trims the drawing to its ink and scales it to the standard Monster
     * image size, keeping the background transparent.
     */
    finish(): FinishedDrawing {
      const bounds = inkBounds();
      const fit = MONSTER_IMAGE_SIZE / Math.max(bounds.width, bounds.height);
      const image = document.createElement("canvas");
      image.width = Math.max(1, Math.round(bounds.width * fit));
      image.height = Math.max(1, Math.round(bounds.height * fit));
      const ctx = image.getContext("2d")!;
      ctx.setTransform(fit, 0, 0, fit, -bounds.left * fit, -bounds.top * fit);
      for (const s of strokes) paintStroke(ctx, s);
      return {
        image,
        ink: {
          width: bounds.width,
          height: bounds.height,
          inkAmount: inkAmount(),
          mainColor: mainColor()?.name ?? COLORS[0].name,
        },
      };
    },
  };
}

export type Drawing = ReturnType<typeof createDrawing>;

/**
 * Paints one stroke as a smooth line: a curve through the midpoints of its
 * points, so a finger's jagged samples come out as a flowing line.
 */
export function paintStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  const pts = stroke.points;
  ctx.strokeStyle = stroke.color.hex;
  ctx.fillStyle = stroke.color.hex;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mid = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mid.x, mid.y);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}
