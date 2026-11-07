import { describe, expect, it } from "vitest";
import type { GameCore } from "./gameCore";
import { buildCore, runFor } from "./testing";

function expectInsideArena(core: GameCore) {
  const { width, height } = core.arena;
  const m = core.monster();
  expect(m.x - m.width / 2).toBeGreaterThanOrEqual(0);
  expect(m.x + m.width / 2).toBeLessThanOrEqual(width);
  expect(m.y - m.height / 2).toBeGreaterThanOrEqual(0);
  expect(m.y + m.height / 2).toBeLessThanOrEqual(height);
}

describe("the Monster in the arena", () => {
  it("bounces off the walls and stays inside the arena", () => {
    const core = buildCore();
    const { width, height } = core.arena;
    const seen = { left: false, right: false, top: false, bottom: false };
    // A wall bounce can happen between frames, so "at the wall" means within one frame's travel.
    const near = 10;

    runFor(core, 30, () => {
      expectInsideArena(core);
      const m = core.monster();
      if (m.x - m.width / 2 <= near) seen.left = true;
      if (m.x + m.width / 2 >= width - near) seen.right = true;
      if (m.y - m.height / 2 <= near) seen.top = true;
      if (m.y + m.height / 2 >= height - near) seen.bottom = true;
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
