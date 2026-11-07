import { describe, expect, it } from "vitest";
import { buildCore, runFor, swipeAcross, tapMonster } from "./testing";

describe("a Monster's voice", () => {
  it("differs from one Monster to the next", () => {
    const voices = new Set([1, 2, 3, 4, 5].map((seed) => buildCore(seed).monster().voice));

    expect(voices.size).toBeGreaterThan(1);
  });

  it("is the same for the same dice", () => {
    expect(buildCore(7).monster().voice).toBe(buildCore(7).monster().voice);
  });

  it("stays the same for the whole Catch", () => {
    const core = buildCore();
    const voice = core.monster().voice;

    tapMonster(core);
    runFor(core, 2);
    core.flick(swipeAcross(core));
    runFor(core, 5);

    expect(core.monster().voice).toBe(voice);
  });
});
