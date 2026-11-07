import { describe, expect, it } from "vitest";
import { A_DRAWING, AN_IMAGE, buildCore, catchIt, newGame, newRound, runFor } from "./testing";

describe("the Round", () => {
  it("goes from the Zoo to Draw, then Bring to life, then Catch, then back to the Zoo", () => {
    const core = newGame();
    expect(core.phase()).toBe("zoo");

    expect(core.startRound()).toBe(true);
    expect(core.phase()).toBe("draw");

    expect(core.finishDrawing(A_DRAWING, AN_IMAGE)).toBe(true);
    expect(core.phase()).toBe("bringToLife");

    core.placeEye({ x: 0.5, y: 0.3 });
    core.pickTemperament("speedy");
    expect(core.startCatch()).toBe(true);
    expect(core.phase()).toBe("catch");

    catchIt(core);
    expect(core.goToZoo()).toBe(true);
    expect(core.phase()).toBe("zoo");
  });

  it("only goes back to the Zoo once the Monster is caught", () => {
    const core = buildCore();

    expect(core.goToZoo()).toBe(false);
    expect(core.phase()).toBe("catch");
  });

  it("starts a Round only from the Zoo", () => {
    const core = buildCore();

    expect(core.startRound()).toBe(false);
    expect(core.phase()).toBe("catch");
  });

  it("stays in Draw if the drawing is just a dot", () => {
    const core = newRound();
    const aDot = { width: 30, height: 30, inkAmount: 700, mainColor: "red" };

    expect(core.enoughInk(aDot.inkAmount)).toBe(false);
    expect(core.finishDrawing(aDot, AN_IMAGE)).toBe(false);

    expect(core.phase()).toBe("draw");
  });

  it("has enough ink for a Monster once a good scribble is drawn", () => {
    expect(newRound().enoughInk(A_DRAWING.inkAmount)).toBe(true);
  });

  it("makes every Monster the same size, whether it was drawn tiny or huge", () => {
    const tiny = buildCore(1, { ...A_DRAWING, width: 90, height: 90 });
    const huge = buildCore(1, { ...A_DRAWING, width: 780, height: 780 });

    expect(tiny.monster().width).toBeCloseTo(huge.monster().width);
    expect(tiny.monster().height).toBeCloseTo(huge.monster().height);
  });

  it("keeps the drawing's shape: a tall drawing makes a tall Monster", () => {
    const tall = buildCore(1, { ...A_DRAWING, width: 200, height: 400 }).monster();
    const round = buildCore(1, { ...A_DRAWING, width: 400, height: 400 }).monster();

    expect(tall.height / tall.width).toBeCloseTo(2);
    expect(tall.height).toBeCloseTo(round.height);
  });

  it("is Bonked by a tap on any part of the drawn Monster, and missed beside it", () => {
    // Tall and thin: twice as tall as it is wide.
    const tall = () => buildCore(1, { ...A_DRAWING, width: 200, height: 400 });
    const { x, y, width, height } = tall().monster();

    expect(tall().bonk({ x, y: y - height * 0.45 })).toBe("bonk"); // near the top of its head
    expect(tall().bonk({ x, y: y + height * 0.45 })).toBe("bonk"); // near its feet
    expect(tall().bonk({ x: x + width / 2, y })).toBe("bonk"); // its side edge
    expect(tall().bonk({ x: x + height * 0.45, y })).toBe("miss"); // beside it, as far out as its head is
  });

  it("is Flicked by a swipe across the drawn Monster, and missed by one beside it", () => {
    const wide = () => buildCore(1, { ...A_DRAWING, width: 400, height: 200 });
    const { x, y, width, height } = wide().monster();
    const downThrough = (atX: number) => [
      { x: atX, y: y - height * 2 },
      { x: atX, y: y + height * 2 },
    ];

    expect(wide().flick(downThrough(x + width * 0.45))).toBe("flick"); // across its far end
    expect(wide().flick([{ x: x - width, y: y - width * 0.45 }, { x: x + width, y: y - width * 0.45 }])).toBe("miss");
    // ^ above it, as far out as its far end is
  });

  it("bounces off the walls at the edges of its drawing, not a fixed size", () => {
    const core = buildCore(1, { ...A_DRAWING, width: 200, height: 400 });
    const { width: arenaW, height: arenaH } = core.arena;
    let touchedTop = false;
    runFor(core, 30, () => {
      const { x, y, width, height } = core.monster();
      expect(x - width / 2).toBeGreaterThanOrEqual(0);
      expect(x + width / 2).toBeLessThanOrEqual(arenaW);
      expect(y - height / 2).toBeGreaterThanOrEqual(0);
      expect(y + height / 2).toBeLessThanOrEqual(arenaH);
      if (y - height / 2 <= 1) touchedTop = true;
    });
    expect(touchedTop).toBe(true);
  });

  it("remembers the drawing's main color", () => {
    const core = buildCore(1, { ...A_DRAWING, mainColor: "orange" });

    expect(core.monster().mainColor).toBe("orange");
  });

  it("has no Monster to Bonk or Flick while it's still being drawn", () => {
    const core = newRound();
    const middle = { x: core.arena.width / 2, y: core.arena.height / 2 };

    expect(core.bonk(middle)).toBe("miss");
    expect(core.flick([{ x: 0, y: middle.y }, { x: core.arena.width, y: middle.y }])).toBe("miss");
    expect(core.tick(1)).toBe("none");
    expect(core.bonk(middle)).toBe("miss");
    expect(core.phase()).toBe("draw");
  });

  it("can only finish the drawing once", () => {
    const core = buildCore(1, { ...A_DRAWING, mainColor: "orange" });

    expect(core.finishDrawing({ ...A_DRAWING, mainColor: "red" }, AN_IMAGE)).toBe(false);

    expect(core.monster().mainColor).toBe("orange");
  });

  it("stays in Draw if the drawing has no size, however much ink was counted", () => {
    const core = newRound();

    expect(core.finishDrawing({ ...A_DRAWING, width: 0, height: 0 }, AN_IMAGE)).toBe(false);

    expect(core.phase()).toBe("draw");
  });
});
