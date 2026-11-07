import { createGameCore } from "./core/gameCore";
import type { Clock, Dice } from "./core/deps";
import { createRenderer } from "./render/renderer";

// Longest step we'll feed the core in one frame. After a stall (e.g. the tab
// was hidden) the game just resumes instead of leaping ahead.
const MAX_DT = 0.1;

// The real-world clock and dice. The core never reaches for these itself,
// so tests can swap in fake ones.
const systemClock: Clock = { now: () => performance.now() };
const randomDice: Dice = { roll: () => Math.random() };

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing #game canvas");

const core = createGameCore({ clock: systemClock, dice: randomDice });
const renderer = createRenderer(canvas, core);

renderer.resize();
window.addEventListener("resize", () => renderer.resize());

let last: number | undefined;
function frame(now: number) {
  const dt = last === undefined ? 0 : Math.min((now - last) / 1000, MAX_DT);
  last = now;
  core.tick(dt);
  renderer.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
