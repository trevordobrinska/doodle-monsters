import {
  createGameCore,
  type FlickResult,
  type GameCore,
  type Point,
  type TapResult,
  type TickResult,
} from "./core/gameCore";
import type { Clock, Dice } from "./core/deps";
import { createRenderer, type Renderer } from "./render/renderer";
import { createHabitatRenderer } from "./render/habitatRenderer";
import { indexedDbZooStorage } from "./storage/indexedDbZooStorage";
import { listenForGestures } from "./input/gestures";
import { createSound, type Effect } from "./sound/sound";
import { createDrawScreen } from "./draw/drawScreen";
import { createBringToLifeScreen } from "./bringToLife/bringToLifeScreen";
import type { FinishedDrawing } from "./draw/drawing";

// Longest step we'll feed the core in one frame. After a stall (e.g. the tab
// was hidden) the game just resumes instead of leaping ahead.
const MAX_DT = 0.1;

// After a catch, the bubble shows for a moment, then the Monster moves into
// the Zoo on its own. A tap after the first moment goes there sooner.
const TAP_TO_ZOO_AFTER_MS = 1500;
const OFF_TO_ZOO_AFTER_MS = 3500;

// The real-world clock and dice. The core never reaches for these itself,
// so tests can swap in fake ones.
const systemClock: Clock = { now: () => Date.now() };
const randomDice: Dice = { roll: () => Math.random() };

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing #game canvas");
const drawScreenRoot = document.querySelector<HTMLElement>("#draw-screen");
if (!drawScreenRoot) throw new Error("Missing #draw-screen");
const bringToLifeRoot = document.querySelector<HTMLElement>("#bring-to-life");
if (!bringToLifeRoot) throw new Error("Missing #bring-to-life");
const zooRoot = document.querySelector<HTMLElement>("#zoo");
if (!zooRoot) throw new Error("Missing #zoo");
const firstTimeArrow = zooRoot.querySelector<HTMLElement>(".first-time")!;
const drawButton = zooRoot.querySelector<HTMLButtonElement>(".draw")!;

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

// One core for as long as the app is open: it keeps the Zoo, and runs each Round in turn.
const core: GameCore = createGameCore({ clock: systemClock, dice: randomDice, storage: indexedDbZooStorage() });
core.setHardMode(savedHardMode());
const habitat = createHabitatRenderer(canvas, core);
habitat.resize();
/** The Catch's renderer. Only exists once the drawing is done and the Catch has begun. */
let renderer: Renderer | undefined;
let catchStartedAt = 0;
let caughtAt: number | undefined;
/** Where the kid is touching the Habitat, in arena coordinates, so Googly Eyes can watch. */
let finger: { pointerId: number; at: Point } | undefined;

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
/** Turning the drawing into a PNG to keep takes a moment; ignore "Done" again meanwhile. */
let finishing = false;

/** The Zoo: the Habitat, and the button that starts a Round. */
function showZoo() {
  renderer = undefined;
  caughtAt = undefined;
  monsterImage = undefined;
  drawScreen.hide();
  bringToLifeScreen.hide();
  canvas!.hidden = false;
  habitat.resize();
  firstTimeArrow.hidden = core.zoo().length > 0;
  zooRoot!.hidden = false;
}

drawButton.addEventListener("click", () => {
  if (!core.startRound()) return;
  zooRoot.hidden = true;
  canvas.hidden = true;
  finger = undefined;
  drawScreen.show();
});

/** The drawing is done: on to Googly Eyes, a Temperament and a name. */
function bringToLife({ image, ink }: FinishedDrawing) {
  if (finishing || !core.enoughInk(ink.inkAmount)) return;
  finishing = true;
  image.toBlob((png) => {
    finishing = false;
    if (!png) {
      console.error("Couldn't turn the drawing into an image");
      return;
    }
    if (!core.finishDrawing(ink, png)) return;
    monsterImage = image;
    drawScreen.hide();
    bringToLifeScreen.show(image);
  }, "image/png");
}

function startCatch() {
  if (!monsterImage || !core.startCatch()) return;
  bringToLifeScreen.hide();
  canvas!.hidden = false;
  renderer = createRenderer(canvas!, core, monsterImage);
  renderer.resize();
  catchStartedAt = performance.now();
}

/** The Catch is over: the caught Monster moves into the Zoo. */
function goToZoo() {
  if (core.goToZoo()) showZoo();
}

// Bring back the saved Zoo, then open straight into it.
core
  .loadZoo()
  .catch((error) => console.error("Couldn't load the Zoo", error))
  .finally(showZoo);

window.addEventListener("resize", () => {
  renderer?.resize();
  habitat.resize();
});

function noteIfCaught(result: TapResult | FlickResult) {
  if (result !== "caught") return;
  caughtAt = performance.now();
  setTimeout(goToZoo, OFF_TO_ZOO_AFTER_MS);
  core.saved().catch((error) => console.error("Couldn't save the Monster", error));
  // Handy while tuning: a normal Catch should take about 30–60 s.
  const { temperament } = core.monster();
  const mode = core.hardMode() ? "hard" : "normal";
  console.info(`Caught ${temperament} (${mode}) in ${((caughtAt - catchStartedAt) / 1000).toFixed(1)} s`);
}

// The gesture layer tells taps from Flicks. The core decides whether they hit the Monster.
// The game canvas is hidden while drawing, and shows the Habitat in the Zoo,
// so these only act during a Catch.
listenForGestures(canvas, (clientX, clientY) => (renderer ?? habitat).toArena(clientX, clientY), {
  onTap(at) {
    if (!renderer) return;
    if (caughtAt !== undefined) {
      if (performance.now() - caughtAt > TAP_TO_ZOO_AFTER_MS) goToZoo();
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

// Googly Eyes in the Habitat watch whichever finger touched last.
canvas.addEventListener("pointerdown", (event) => {
  finger = { pointerId: event.pointerId, at: habitat.toArena(event.clientX, event.clientY) };
});
canvas.addEventListener("pointermove", (event) => {
  if (finger?.pointerId === event.pointerId) finger.at = habitat.toArena(event.clientX, event.clientY);
});
const letGo = (event: PointerEvent) => {
  if (finger?.pointerId === event.pointerId) finger = undefined;
};
canvas.addEventListener("pointerup", letGo);
canvas.addEventListener("pointercancel", letGo);

let last: number | undefined;
function frame(now: number) {
  const dt = last === undefined ? 0 : Math.min((now - last) / 1000, MAX_DT);
  last = now;
  playFor(core.tick(dt));
  if (core.phase() === "zoo") habitat.draw(dt, finger?.at);
  else renderer?.draw(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
