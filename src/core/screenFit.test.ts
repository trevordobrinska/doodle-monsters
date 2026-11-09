import { describe, expect, it } from "vitest";
import { fitScreen } from "./screenFit";

const SURFACE = { width: 1280, height: 800 };

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
});
