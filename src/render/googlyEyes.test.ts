import { describe, expect, it } from "vitest";
import { popInScale } from "./googlyEyes";

describe("popInScale", () => {
  // A frame's timestamp is when the frame began, which can be just before the
  // tap that stuck the eye on. A negative size makes the canvas throw, which
  // stopped the Bring to life screen drawing for good.
  it("is never negative when the frame's time is just before the eye was stuck on", () => {
    for (const seconds of [-0.001, -0.016, -0.05, -1]) {
      expect(popInScale(seconds)).toBeGreaterThanOrEqual(0);
    }
  });

  it("starts at nothing and ends at full size", () => {
    expect(popInScale(0)).toBeCloseTo(0);
    expect(popInScale(0.25)).toBe(1);
    expect(popInScale(10)).toBe(1);
  });

  it("overshoots a little on the way", () => {
    const sizes = Array.from({ length: 25 }, (_, i) => popInScale(i / 100));
    expect(Math.max(...sizes)).toBeGreaterThan(1);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(0);
  });
});
