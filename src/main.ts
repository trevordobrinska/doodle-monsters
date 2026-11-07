import {
  createGameCore,
  type FlickResult,
  type GameCore,
  type TapResult,
  type TickResult,
} from "./core/gameCore";
import type { Clock, Dice } from "./core/deps";
import { createRenderer, type Renderer } from "./render/renderer";
import { listenForGestures } from "./input/gestures";
import { createSound, type Effect } from "./sound/sound";

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

const sound = createSound();

/** The sound each result the core reports makes, if any. A Flick sounds when it hits the wall. */
const EFFECT_FOR: Partial<Record<TapResult | FlickResult | TickResult, Effect>> = {
  bonk: "bonk",
  boing: "boing",
  caught: "caught",
  wallHit: "wallHit",
};

/** Plays a result's sound in this Monster's voice. */
function playFor(result: TapResult | FlickResult | TickResult) {
  const effect = EFFECT_FOR[result];
  if (effect) sound.play(effect, core.monster().voice);
}

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

function noteIfCaught(result: TapResult | FlickResult) {
  if (result !== "caught") return;
  caughtAt = performance.now();
  // Handy while tuning: a normal Catch should take about 30–60 s.
  console.info(`Caught in ${((caughtAt - catchStartedAt) / 1000).toFixed(1)} s`);
}

// The gesture layer tells taps from Flicks. The core decides whether they hit the Monster.
listenForGestures(canvas, (clientX, clientY) => renderer.toArena(clientX, clientY), {
  onTap(at) {
    if (caughtAt !== undefined) {
      if (performance.now() - caughtAt > NEW_CATCH_AFTER_MS) startCatch();
      return;
    }
    const result = core.bonk(at);
    renderer.showTap(result, at);
    playFor(result);
    noteIfCaught(result);
  },
  onFlick(path) {
    if (caughtAt !== undefined) return;
    const result = core.flick(path);
    renderer.showFlick(result, path);
    playFor(result);
    noteIfCaught(result);
  },
});

let last: number | undefined;
function frame(now: number) {
  const dt = last === undefined ? 0 : Math.min((now - last) / 1000, MAX_DT);
  last = now;
  playFor(core.tick(dt));
  renderer.draw(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
