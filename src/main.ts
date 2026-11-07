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
import { createDrawScreen } from "./draw/drawScreen";
import { createBringToLifeScreen } from "./bringToLife/bringToLifeScreen";
import type { FinishedDrawing } from "./draw/drawing";

// Longest step we'll feed the core in one frame. After a stall (e.g. the tab
// was hidden) the game just resumes instead of leaping ahead.
const MAX_DT = 0.1;

// After a catch, how long the bubble shows before a tap starts a new Round.
// Placeholder until the Zoo exists (ticket 09).
const NEW_ROUND_AFTER_MS = 1500;

// The real-world clock and dice. The core never reaches for these itself,
// so tests can swap in fake ones.
const systemClock: Clock = { now: () => performance.now() };
const randomDice: Dice = { roll: () => Math.random() };

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing #game canvas");
const drawScreenRoot = document.querySelector<HTMLElement>("#draw-screen");
if (!drawScreenRoot) throw new Error("Missing #draw-screen");
const bringToLifeRoot = document.querySelector<HTMLElement>("#bring-to-life");
if (!bringToLifeRoot) throw new Error("Missing #bring-to-life");

const sound = createSound();

// Hard mode is remembered on this tablet from Round to Round. It's a setting,
// not part of the Zoo, so it doesn't go through Zoo storage.
const HARD_MODE_KEY = "doodle-monsters:hard-mode";
function savedHardMode(): boolean {
  try {
    return localStorage.getItem(HARD_MODE_KEY) === "on";
  } catch {
    return false;
  }
}
function saveHardMode(on: boolean) {
  try {
    localStorage.setItem(HARD_MODE_KEY, on ? "on" : "off");
  } catch {
    // Storage unavailable: hard mode just won't be remembered.
  }
}

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
/** Only exists once the drawing is done and the Catch has begun. */
let renderer: Renderer | undefined;
let catchStartedAt = 0;
let caughtAt: number | undefined;

const drawScreen = createDrawScreen(drawScreenRoot, {
  enoughInk: (inkAmount) => core.enoughInk(inkAmount),
  onDone: bringToLife,
});

const bringToLifeScreen = createBringToLifeScreen(bringToLifeRoot, {
  core: () => core,
  onStart: startCatch,
  onHardModeChange: saveHardMode,
});
/** The kid's finished drawing, kept from Bring to life for the Catch. */
let monsterImage: HTMLCanvasElement | undefined;

/** A new Round begins on the drawing screen. */
function startRound() {
  core = createGameCore({ clock: systemClock, dice: randomDice });
  core.setHardMode(savedHardMode());
  renderer = undefined;
  caughtAt = undefined;
  monsterImage = undefined;
  canvas!.hidden = true;
  bringToLifeScreen.hide();
  drawScreen.show();
}

/** The drawing is done: on to Googly Eyes, a Temperament and a name. */
function bringToLife({ image, ink }: FinishedDrawing) {
  if (!core.finishDrawing(ink)) return;
  monsterImage = image;
  drawScreen.hide();
  bringToLifeScreen.show(image);
}

function startCatch() {
  if (!monsterImage || !core.startCatch()) return;
  bringToLifeScreen.hide();
  canvas!.hidden = false;
  renderer = createRenderer(canvas!, core, monsterImage);
  renderer.resize();
  catchStartedAt = performance.now();
}
startRound();

window.addEventListener("resize", () => renderer?.resize());

function noteIfCaught(result: TapResult | FlickResult) {
  if (result !== "caught") return;
  caughtAt = performance.now();
  // Handy while tuning: a normal Catch should take about 30–60 s.
  const { temperament } = core.monster();
  const mode = core.hardMode() ? "hard" : "normal";
  console.info(`Caught ${temperament} (${mode}) in ${((caughtAt - catchStartedAt) / 1000).toFixed(1)} s`);
}

// The gesture layer tells taps from Flicks. The core decides whether they hit the Monster.
// The game canvas is hidden while drawing, so these only fire during a Catch.
listenForGestures(canvas, (clientX, clientY) => renderer!.toArena(clientX, clientY), {
  onTap(at) {
    if (!renderer) return;
    if (caughtAt !== undefined) {
      if (performance.now() - caughtAt > NEW_ROUND_AFTER_MS) startRound();
      return;
    }
    const result = core.bonk(at);
    renderer.showTap(result, at);
    playFor(result);
    noteIfCaught(result);
  },
  onFlick(path) {
    if (!renderer || caughtAt !== undefined) return;
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
  renderer?.draw(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
