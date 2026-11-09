import {
  ARENA,
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
import { viewportSize } from "./render/viewport";
import { fitScreen } from "./core/screenFit";
import { indexedDbZooStorage } from "./storage/indexedDbZooStorage";
import { listenForGestures } from "./input/gestures";
import { createSound, type Effect } from "./sound/sound";
import { createDrawScreen } from "./draw/drawScreen";
import { createBringToLifeScreen } from "./bringToLife/bringToLifeScreen";
import { createNameCard } from "./zoo/nameCard";
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

const appRoot = document.querySelector<HTMLElement>("#app");
if (!appRoot) throw new Error("Missing #app");
// Before anything measures itself: the first frame is already turned right, and
// this resize listener runs before the screens' own, so they measure the new frame.
placeAppRoot();
window.addEventListener("resize", placeAppRoot);

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing #game canvas");
const drawScreenRoot = document.querySelector<HTMLElement>("#draw-screen");
if (!drawScreenRoot) throw new Error("Missing #draw-screen");
const bringToLifeRoot = document.querySelector<HTMLElement>("#bring-to-life");
if (!bringToLifeRoot) throw new Error("Missing #bring-to-life");
const zooRoot = document.querySelector<HTMLElement>("#zoo");
if (!zooRoot) throw new Error("Missing #zoo");
const nameCardRoot = document.querySelector<HTMLElement>("#name-card");
if (!nameCardRoot) throw new Error("Missing #name-card");
const firstTimeArrow = zooRoot.querySelector<HTMLElement>(".first-time")!;
const drawButton = zooRoot.querySelector<HTMLButtonElement>(".draw")!;
const previousHabitatButton = zooRoot.querySelector<HTMLButtonElement>(".habitat-arrow.previous")!;
const nextHabitatButton = zooRoot.querySelector<HTMLButtonElement>(".habitat-arrow.next")!;
const habitatDots = zooRoot.querySelector<HTMLElement>(".habitat-dots")!;

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
const storage = indexedDbZooStorage();
const core: GameCore = createGameCore({ clock: systemClock, dice: randomDice, storage });
core.setHardMode(savedHardMode());
const habitat = createHabitatRenderer(canvas, core);
habitat.resize();
placeZooOverlay();
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
const nameCard = createNameCard(nameCardRoot, {
  // The core forgets the Monster in storage at once; it waves and walks off.
  onGoodbye(id) {
    if (core.sayGoodbye(id)) core.saved().catch((error) => console.error("Couldn't Say Goodbye", error));
  },
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
  showFirstTimeArrow();
  showHabitatControls();
  zooRoot!.hidden = false;
}

/** A Zoo split into several Habitats gets ◀ ▶ to move between them, and a dot for each. */
let controlsFor = "";
function showHabitatControls() {
  const count = core.habitatCount();
  const shown = core.shownHabitat();
  // Only touch the page when something changed: this runs every frame.
  if (controlsFor === `${shown}/${count}`) return;
  controlsFor = `${shown}/${count}`;
  previousHabitatButton.hidden = shown === 0;
  nextHabitatButton.hidden = shown === count - 1;
  habitatDots.hidden = count < 2;
  habitatDots.replaceChildren(
    ...Array.from({ length: count }, (_, i) => {
      const dot = document.createElement("span");
      dot.classList.toggle("shown", i === shown);
      return dot;
    }),
  );
}

/** Moves to the Habitat this many along (1 is the next one), if there is one. */
function moveHabitat(by: number) {
  if (core.phase() !== "zoo" || !core.showHabitat(core.shownHabitat() + by)) return;
  showHabitatControls();
}
previousHabitatButton.addEventListener("click", () => moveHabitat(-1));
nextHabitatButton.addEventListener("click", () => moveHabitat(1));

/** The arrow to "Draw a Monster!" shows while the Zoo is empty, as it is again after the last goodbye. */
function showFirstTimeArrow() {
  firstTimeArrow.hidden = core.zoo().length > 0;
}

drawButton.addEventListener("click", () => {
  if (!core.startRound()) return;
  nameCard.hide();
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
  showCatch(monsterImage);
  // The core saves the Monster Napping as its Catch begins.
  core.saved().catch((error) => console.error("Couldn't save the Napping Monster", error));
}

/** The Catch screen, for the Monster drawn as `image`. */
function showCatch(image: CanvasImageSource) {
  zooRoot!.hidden = true;
  canvas!.hidden = false;
  finger = undefined;
  renderer = createRenderer(canvas!, core, image);
  renderer.resize();
  catchStartedAt = performance.now();
}

/** The Catch is over: the caught Monster moves into the Zoo. */
function goToZoo() {
  if (core.goToZoo()) showZoo();
}

/** Decoding a Napping Monster's drawing takes a moment; ignore more taps meanwhile. */
let resuming = false;

/** The kid tapped a Napping Monster in the Zoo: back to its Catch. */
function resumeNapping(id: string, image: Blob) {
  if (resuming) return;
  resuming = true;
  createImageBitmap(image)
    .then((bitmap) => {
      if (!core.resume(id)) return;
      showCatch(bitmap);
      // The app was hidden while the drawing decoded: straight back to Napping.
      if (document.visibilityState === "hidden") leave();
    })
    .catch((error) => console.error("Couldn't resume the Napping Monster", error))
    .finally(() => (resuming = false));
}

// Leaving mid-Catch (the app hidden, closed or navigated away from) sends the
// Monster to the Zoo Napping. The core saved it the moment its Catch began,
// so it's kept even if the tablet closes the app without another word.
function leave() {
  if (core.leave()) showZoo();
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") leave();
});
window.addEventListener("pagehide", leave);

/**
 * Dev only: `?placeholders=10` fills the Zoo with 10 placeholder Monsters
 * for playtesting (and `?placeholders=0` clears them). Left out of the build.
 */
async function seedForDev() {
  const wanted = new URLSearchParams(location.search).get("placeholders");
  if (!import.meta.env.DEV || wanted === null) return;
  const { seedPlaceholders } = await import("./dev/placeholders");
  await seedPlaceholders(storage, Math.max(0, Math.floor(Number(wanted)) || 0));
}

// Bring back the saved Zoo, then open straight into it.
seedForDev()
  .catch((error) => console.error("Couldn't add placeholder Monsters", error))
  .then(() => core.loadZoo())
  .catch((error) => console.error("Couldn't load the Zoo", error))
  .finally(showZoo);

window.addEventListener("resize", () => {
  renderer?.resize();
  habitat.resize();
  placeZooOverlay();
});

/**
 * Landscape only (ADR 0002): every screen sits in one app root, sized to the
 * screen fit's frame and, when the window is tall, turned a quarter by CSS so
 * it fills the long side. Only re-lays out: no game state is touched.
 */
function placeAppRoot() {
  const { frame, transform } = fitScreen(viewportSize(), ARENA);
  Object.assign(appRoot!.style, { width: `${frame.width}px`, height: `${frame.height}px`, transform });
}

/**
 * The zoo overlay sits on the Habitat's rectangle, not the window, so the Draw
 * button and the Habitat arrows stay off the bars. Same fit as the Letterbox,
 * so they can't disagree about where the Habitat is. Buttons keep their pixel sizes.
 */
function placeZooOverlay() {
  const { rect } = fitScreen(viewportSize(), ARENA);
  Object.assign(zooRoot!.style, {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
}

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
// The game canvas is hidden while drawing. In the Zoo, tapping a Napping
// Monster resumes its Catch, and tapping any other opens its Name Card.
listenForGestures(canvas, (clientX, clientY) => (renderer ?? habitat).toArena(clientX, clientY), {
  onTap(at) {
    if (core.phase() === "zoo") {
      const tapped = core.zooMonsterAt(at);
      if (tapped?.napping) resumeNapping(tapped.id, tapped.image);
      else if (tapped) nameCard.show(tapped);
      return;
    }
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
    // In the Zoo, a sideways swipe moves to the next Habitat (swipe left) or back (swipe right).
    if (core.phase() === "zoo") {
      const dx = path[path.length - 1].x - path[0].x;
      const dy = path[path.length - 1].y - path[0].y;
      if (Math.abs(dx) > Math.abs(dy)) moveHabitat(dx < 0 ? 1 : -1);
      return;
    }
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
  if (core.phase() === "zoo") {
    habitat.draw(dt, finger?.at);
    showFirstTimeArrow();
    showHabitatControls();
  }
  else renderer?.draw(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
