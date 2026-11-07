import { describe, expect, it } from "vitest";
import type { GameCore } from "./gameCore";
import { buildCore, runFor } from "./testing";

function expectInsideArena(core: GameCore) {
  const { width, height } = core.arena;
  const { x, y, radius } = core.blob();
  expect(x - radius).toBeGreaterThanOrEqual(0);
  expect(x + radius).toBeLessThanOrEqual(width);
  expect(y - radius).toBeGreaterThanOrEqual(0);
  expect(y + radius).toBeLessThanOrEqual(height);
}

describe("the blob in the arena", () => {
  it("bounces off the walls and stays inside the arena", () => {
    const core = buildCore();
    const { width, height } = core.arena;
    const seen = { left: false, right: false, top: false, bottom: false };

    runFor(core, 30, () => {
      expectInsideArena(core);
      const { x, y, radius } = core.blob();
      if (x - radius <= 1) seen.left = true;
      if (x + radius >= width - 1) seen.right = true;
      if (y - radius <= 1) seen.top = true;
      if (y + radius >= height - 1) seen.bottom = true;
    });

    // Over 30 seconds it should have travelled to, and come back from, every wall.
    expect(seen).toEqual({ left: true, right: true, top: true, bottom: true });
  });

  it("stays inside the arena even after one very long frame", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const core = buildCore(seed);
      core.tick(5);
      expectInsideArena(core);
    }
  });
});
