import { describe, expect, it } from "vitest";
import { fitScreen } from "./screenFit";
// The Arena is the 1280×800 surface every screen fits.
import { ARENA as SURFACE } from "./gameCore";


describe("the screen fit", () => {
  it("a 1280×800 window shows the surface 1:1 with no bars", () => {
    const fit = fitScreen({ width: 1280, height: 800 }, SURFACE);

    expect(fit.turned).toBe(false);
    expect(fit.frame).toEqual({ width: 1280, height: 800 });
    expect(fit.rect).toEqual({ x: 0, y: 0, width: 1280, height: 800 });
    expect(fit.toSurface(0, 0)).toEqual({ x: 0, y: 0 });
    expect(fit.toSurface(300, 450)).toEqual({ x: 300, y: 450 });
    expect(fit.toSurface(1280, 800)).toEqual({ x: 1280, y: 800 });
  });

  it("a short landscape window (the Kids top bar) gets equal bars left and right", () => {
    const fit = fitScreen({ width: 1280, height: 720 }, SURFACE);

    expect(fit.turned).toBe(false);
    expect(fit.frame).toEqual({ width: 1280, height: 720 });
    // 720 / 800 = 0.9, so the surface is 1152 wide, leaving 128 split into two 64 bars.
    expect(fit.rect).toEqual({ x: 64, y: 0, width: 1152, height: 720 });
  });

  it("the Habitat's corners and centre land on the surface's", () => {
    const fit = fitScreen({ width: 1280, height: 720 }, SURFACE);

    expect(fit.toSurface(64, 0)).toEqual({ x: 0, y: 0 });
    expect(fit.toSurface(1216, 720)).toEqual({ x: 1280, y: 800 });
    expect(fit.toSurface(640, 360)).toEqual({ x: 640, y: 400 });
  });

  it("a finger on a bar lands outside the Arena", () => {
    const fit = fitScreen({ width: 1280, height: 720 }, SURFACE);

    expect(fit.toSurface(10, 360).x).toBeLessThan(0);
    expect(fit.toSurface(1270, 360).x).toBeGreaterThan(1280);
  });

  it("a tall window (tablet upright) is turned, and the surface fills the turned frame", () => {
    const fit = fitScreen({ width: 800, height: 1280 }, SURFACE);

    expect(fit.turned).toBe(true);
    expect(fit.frame).toEqual({ width: 1280, height: 800 });
    expect(fit.rect).toEqual({ x: 0, y: 0, width: 1280, height: 800 });
  });

  it("a tall window with the Kids top bar is turned, with bars in the turned frame", () => {
    const fit = fitScreen({ width: 800, height: 1200 }, SURFACE);

    expect(fit.turned).toBe(true);
    expect(fit.frame).toEqual({ width: 1200, height: 800 });
    // 1200 / 1280 = 0.9375, so the surface is 750 tall, leaving 50 split into two 25 bars.
    expect(fit.rect).toEqual({ x: 0, y: 25, width: 1200, height: 750 });
  });

  // Upright, the picture's top runs down the screen's left edge (the TURN), so
  // turning the tablet a quarter clockwise stands it the right way up.
  it("when turned, the Habitat's corners as tapped on the upright screen land on the Arena's corners", () => {
    const fit = fitScreen({ width: 800, height: 1200 }, SURFACE);

    expect(fit.toSurface(25, 1200)).toEqual({ x: 0, y: 0 }); // the screen's bottom-left
    expect(fit.toSurface(25, 0)).toEqual({ x: 1280, y: 0 }); // top-left
    expect(fit.toSurface(775, 1200)).toEqual({ x: 0, y: 800 }); // bottom-right
    expect(fit.toSurface(775, 0)).toEqual({ x: 1280, y: 800 }); // top-right
  });

  it("when turned, the screen's centre lands on the Arena's centre", () => {
    const fit = fitScreen({ width: 800, height: 1200 }, SURFACE);

    expect(fit.toSurface(400, 600)).toEqual({ x: 640, y: 400 });
  });

  it("when turned, a swipe keeps its direction relative to the picture (for Flicks)", () => {
    const fit = fitScreen({ width: 800, height: 1200 }, SURFACE);
    const from = fit.toSurface(400, 600);

    // Down the upright screen is towards the picture's left (its top is on the left edge).
    const down = fit.toSurface(400, 750);
    expect(down.x).toBeLessThan(from.x);
    expect(down.y).toBeCloseTo(from.y);
    // Right across the upright screen is towards the picture's bottom.
    const right = fit.toSurface(550, 600);
    expect(right.y).toBeGreaterThan(from.y);
    expect(right.x).toBeCloseTo(from.x);
    // And the distance is scaled, not stretched: 150 CSS px is 160 Arena units at 0.9375.
    expect(from.x - down.x).toBeCloseTo(160);
    expect(right.y - from.y).toBeCloseTo(160);
  });

  it("when turned, a finger on a bar lands outside the Arena", () => {
    const fit = fitScreen({ width: 800, height: 1200 }, SURFACE);

    // The bars run down the upright screen's left and right edges.
    expect(fit.toSurface(10, 600).y).toBeLessThan(0);
    expect(fit.toSurface(790, 600).y).toBeGreaterThan(800);
  });

  it("when turned, a pointer maps into the frame the app is laid out in", () => {
    const fit = fitScreen({ width: 800, height: 1200 }, SURFACE);

    expect(fit.toFrame(0, 1200)).toEqual({ x: 0, y: 0 }); // the frame's top-left is the screen's bottom-left
    expect(fit.toFrame(800, 0)).toEqual({ x: 1200, y: 800 });
  });

  it("when not turned, the frame is the window and pointers map straight into it", () => {
    const fit = fitScreen({ width: 1280, height: 720 }, SURFACE);

    expect(fit.toFrame(100, 200)).toEqual({ x: 100, y: 200 });
    expect(fit.transform).toBe("none");
  });

  it("when turned, the CSS transform puts each frame corner where the pointer mapping expects it", () => {
    const fit = fitScreen({ width: 800, height: 1200 }, SURFACE);
    const { width, height } = fit.frame;

    for (const corner of [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: 0, y: height },
      { x: width, y: height },
    ]) {
      const onScreen = applyCssTransform(fit.transform, corner);
      const back = fit.toFrame(onScreen.x, onScreen.y);
      expect(back.x).toBeCloseTo(corner.x);
      expect(back.y).toBeCloseTo(corner.y);
    }
  });
});

/**
 * Where a frame point lands on the window under a `translate(Xpx, Ypx) rotate(Ddeg)`
 * transform with `transform-origin: 0 0`, the way the browser applies it.
 */
function applyCssTransform(transform: string, p: { x: number; y: number }) {
  const match = /^translate\((-?[\d.]+)px, (-?[\d.]+)px\) rotate\((-?[\d.]+)deg\)$/.exec(transform);
  if (!match) throw new Error(`Unexpected transform: ${transform}`);
  const [tx, ty, degrees] = match.slice(1).map(Number);
  const a = (degrees * Math.PI) / 180;
  return { x: tx + p.x * Math.cos(a) - p.y * Math.sin(a), y: ty + p.x * Math.sin(a) + p.y * Math.cos(a) };
}
