import { createGameCore, type GameCore } from "./core/gameCore";
import type { Clock, Dice } from "./core/deps";
import { createRenderer, type Renderer } from "./render/renderer";

// Longest step we'll feed the core in one frame. After a stall (e.g. the tab
// was hidden) the game just resumes instead of leaping ahead.
const MAX_DT = 0.1;

// After a catch, how long the bubble shows before a tap starts a new Catch.
// Placeholder until the Round (Draw → Catch → Zoo) exists.
const NEW_CATCH_AFTER_MS = 1500;

// The real-world clock and dice. The core never reaches for these itself,
// so tests can swap in fake ones.
const systemClock: Clock = { now: () => performance.now() };
const randomDice: Dice = { roll: () => Math.random() };

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing #game canvas");

let core: GameCore;
let renderer: Renderer;
let catchStartedAt = 0;
let caughtAt: number | undefined;

function startCatch() {
  core = createGameCore({ clock: systemClock, dice: randomDice });
  renderer = createRenderer(canvas!, core);
  renderer.resize();
  catchStartedAt = performance.now();
  caughtAt = undefined;
}
startCatch();

window.addEventListener("resize", () => renderer.resize());

// Every finger-down is a tap. The core decides whether it hit the Monster.
canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (caughtAt !== undefined) {
    if (performance.now() - caughtAt > NEW_CATCH_AFTER_MS) startCatch();
    return;
  }
  const at = renderer.toArena(event.clientX, event.clientY);
  const result = core.bonk(at);
  renderer.showTap(result, at);
  if (result === "caught") {
    caughtAt = performance.now();
    // Handy while tuning: a normal Catch should take about 30–60 s.
    console.info(`Caught in ${((caughtAt - catchStartedAt) / 1000).toFixed(1)} s`);
  }
});

let last: number | undefined;
function frame(now: number) {
  const dt = last === undefined ? 0 : Math.min((now - last) / 1000, MAX_DT);
  last = now;
  core.tick(dt);
  renderer.draw(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
