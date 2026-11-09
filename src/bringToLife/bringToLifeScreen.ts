import { MAX_EYES, type GameCore, type GooglyEye, type Point } from "../core/gameCore";
import { TEMPERAMENTS } from "../core/temperaments";
import { createPupil, drawGooglyEye, eyeRadius, type Pupil } from "../render/googlyEyes";
import { ARENA } from "../core/gameCore";
import { fitScreen, type ScreenFit } from "../core/screenFit";
import { viewportSize } from "../render/viewport";

/**
 * The Bring to life screen, between drawing and the Catch: the kid sticks
 * Googly Eyes on their drawing (tap to stick, drag to move, drag off the
 * Monster to take one off), picks a Temperament and keeps, rerolls or types
 * a name. Hard mode can be flipped here too. Every rule (how many eyes,
 * what's needed to start) is the core's; this screen just sends it the kid's
 * choices and shows what it says.
 */
export interface BringToLifeOptions {
  /** The current Round's core. It changes each Round. */
  core(): GameCore;
  /** "Catch it!" was pressed. */
  onStart(): void;
  /** Hard mode was flipped on or off, so it can be remembered. */
  onHardModeChange(on: boolean): void;
}

export interface BringToLifeScreen {
  /** Shows the screen for the kid's finished drawing. */
  show(image: HTMLCanvasElement): void;
  hide(): void;
}

/** The drawing fills this much of the stage, leaving room around it to drag eyes off. */
const DRAWING_FILL = 0.78;
/** Room for the hint across the top of the stage, in CSS pixels. */
const HINT_ROOM = 64;
/** Seconds a new eye takes to pop on. */
const POP_SECONDS = 0.25;
/** Eyes are grabbed this far outside their edge, for small fingers, as a fraction of their radius. */
const GRAB_SLACK = 0.4;

interface Drag {
  eyeId: number;
  pointerId: number;
  /** Where the eye is being held, in canvas pixels. */
  at: Point;
  /** From the finger to the eye's centre, so the eye doesn't jump to the finger. */
  grip: Point;
  /** Held off the drawing: let go here and the eye comes off. */
  off: boolean;
}

export function createBringToLifeScreen(root: HTMLElement, options: BringToLifeOptions): BringToLifeScreen {
  root.innerHTML = `
    <div class="stage">
      <canvas></canvas>
      <div class="hint"></div>
    </div>
    <div class="panel">
      <div class="label">Name</div>
      <div class="name-row">
        <input class="name" type="text" autocomplete="off" autocapitalize="words" spellcheck="false" />
        <button class="reroll" aria-label="New name">🎲</button>
      </div>
      <div class="label">Temperament</div>
      <div class="temperaments"></div>
      <button class="hard-mode" aria-pressed="false">💪 Hard mode: <span>off</span></button>
      <button class="start">Catch it! ▶</button>
    </div>
  `;
  const stage = root.querySelector<HTMLElement>(".stage")!;
  const canvas = root.querySelector<HTMLCanvasElement>("canvas")!;
  const ctx = canvas.getContext("2d")!;
  const hint = root.querySelector<HTMLElement>(".hint")!;
  const nameInput = root.querySelector<HTMLInputElement>(".name")!;
  const rerollButton = root.querySelector<HTMLButtonElement>(".reroll")!;
  const temperamentsBox = root.querySelector<HTMLElement>(".temperaments")!;
  const startButton = root.querySelector<HTMLButtonElement>(".start")!;
  const hardModeButton = root.querySelector<HTMLButtonElement>(".hard-mode")!;

  const core = () => options.core();
  let image: HTMLCanvasElement | undefined;
  /** Where the drawing sits on the canvas, in canvas pixels. */
  let box = { x: 0, y: 0, width: 1, height: 1 };
  let drag: Drag | undefined;
  /** How the app sits on the screen. Re-fitted on every resize. */
  let fit: ScreenFit = fitScreen(viewportSize(), ARENA);
  /** Where the canvas's top-left sits in the frame, CSS pixels. Re-measured on every resize. */
  let canvasAt: Point = { x: 0, y: 0 };
  let frameId: number | undefined;
  let lastFrame: number | undefined;
  // Per-eye visual state, by eye id: its loose pupil, and when it was stuck on (to pop it on).
  const pupils = new Map<number, Pupil>();
  const bornAt = new Map<number, number>();

  for (const t of TEMPERAMENTS) {
    const button = document.createElement("button");
    button.className = "temperament";
    button.dataset.temperament = t.id;
    button.innerHTML = `<span class="icon">${t.icon}</span><span class="word">${t.word}</span>`;
    button.addEventListener("click", () => {
      core().pickTemperament(t.id);
      update();
    });
    temperamentsBox.append(button);
  }
  const temperamentButtons = [...temperamentsBox.children] as HTMLButtonElement[];

  nameInput.addEventListener("input", () => {
    core().setName(nameInput.value);
    // The core cuts very long names short; show what it kept.
    if (nameInput.value !== core().name()) nameInput.value = core().name();
    update();
  });
  // Enter puts the keyboard away.
  nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") nameInput.blur();
  });

  rerollButton.addEventListener("click", () => {
    core().rerollName();
    nameInput.value = core().name();
    rerollButton.classList.remove("rolling");
    void rerollButton.offsetWidth; // restart the spin
    rerollButton.classList.add("rolling");
    update();
  });

  hardModeButton.addEventListener("click", () => {
    core().setHardMode(!core().hardMode());
    options.onHardModeChange(core().hardMode());
    update();
  });

  startButton.addEventListener("click", () => {
    if (drag || !core().canStartCatch()) return;
    options.onStart();
  });

  function update() {
    const c = core();
    const picked = c.monster().temperament;
    for (const b of temperamentButtons) b.classList.toggle("chosen", b.dataset.temperament === picked);
    startButton.disabled = !c.canStartCatch();
    hardModeButton.classList.toggle("on", c.hardMode());
    hardModeButton.setAttribute("aria-pressed", String(c.hardMode()));
    hardModeButton.querySelector("span")!.textContent = c.hardMode() ? "ON" : "off";
    const count = c.eyes().length;
    hint.innerHTML =
      count === 0
        ? "Tap your Monster to stick on Googly Eyes! 👀"
        : `Drag an eye to move it, or off your Monster to take it off. <b>${count}/${MAX_EYES}</b>`;
  }

  /** "No more eyes": a little shake of the hint. */
  function shakeHint() {
    hint.classList.remove("shake");
    void hint.offsetWidth;
    hint.classList.add("shake");
  }

  function resize() {
    fit = fitScreen(viewportSize(), ARENA);
    canvasAt = layoutOffset(canvas, root);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
    if (!image) return;
    const top = HINT_ROOM * dpr;
    const imageScale = Math.min(
      (canvas.width * DRAWING_FILL) / image.width,
      ((canvas.height - top) * DRAWING_FILL) / image.height,
    );
    const width = image.width * imageScale;
    const height = image.height * imageScale;
    box = { x: (canvas.width - width) / 2, y: top + (canvas.height - top - height) / 2, width, height };
  }

  const radius = () => eyeRadius(box.width, box.height);
  /**
   * A pointer → canvas pixels, through the screen fit rather than the canvas's
   * on-screen rectangle (which, once the app is turned, is the rotated
   * bounding box). The fit gives the point in the frame; the canvas's layout
   * offset, which ignores the turn, says where the canvas sits in it.
   */
  const toCanvas = (event: PointerEvent): Point => {
    const at = fit.toFrame(event.clientX, event.clientY);
    const pixelsPerCss = canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1;
    return { x: (at.x - canvasAt.x) * pixelsPerCss, y: (at.y - canvasAt.y) * pixelsPerCss };
  };
  /** Canvas pixels → a point relative to the drawing's box, the way the core keeps eyes. */
  const toDrawing = (p: Point): Point => ({ x: (p.x - box.x) / box.width, y: (p.y - box.y) / box.height });
  const fromDrawing = (p: Point): Point => ({ x: box.x + p.x * box.width, y: box.y + p.y * box.height });
  /** More than an eye's width outside the drawing counts as off it. */
  const offDrawing = (p: Point) => {
    const r = radius();
    return p.x < box.x - r || p.x > box.x + box.width + r || p.y < box.y - r || p.y > box.y + box.height + r;
  };

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (drag) return;
    nameInput.blur();
    const p = toCanvas(event);
    const c = core();
    const r = radius();
    // The topmost eye under the finger, if any.
    const grabbed = [...c.eyes()].reverse().find((eye) => {
      const at = fromDrawing(eye);
      return Math.hypot(at.x - p.x, at.y - p.y) <= r * (1 + GRAB_SLACK);
    });
    if (grabbed) {
      const at = fromDrawing(grabbed);
      drag = { eyeId: grabbed.id, pointerId: event.pointerId, at, grip: { x: at.x - p.x, y: at.y - p.y }, off: false };
    } else {
      if (offDrawing(p)) return;
      const placed = c.placeEye(toDrawing(p));
      if (!placed) {
        shakeHint();
        return;
      }
      bornAt.set(placed.id, performance.now());
      drag = { eyeId: placed.id, pointerId: event.pointerId, at: fromDrawing(placed), grip: { x: 0, y: 0 }, off: false };
      update();
    }
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (drag?.pointerId !== event.pointerId) return;
    const p = toCanvas(event);
    drag.at = { x: p.x + drag.grip.x, y: p.y + drag.grip.y };
    drag.off = offDrawing(drag.at);
    if (!drag.off) core().moveEye(drag.eyeId, toDrawing(drag.at));
  });

  canvas.addEventListener("pointerup", (event) => {
    if (drag?.pointerId !== event.pointerId) return;
    if (drag.off) {
      core().removeEye(drag.eyeId);
      pupils.delete(drag.eyeId);
    }
    drag = undefined;
    update();
  });
  // A cancelled touch (a palm, a system gesture) isn't the kid letting go,
  // so the eye stays where the core last had it rather than coming off.
  canvas.addEventListener("pointercancel", (event) => {
    if (drag?.pointerId !== event.pointerId) return;
    drag = undefined;
    update();
  });

  /** Where an eye is shown: under the finger while dragged, otherwise where the core has it. */
  function shownAt(eye: GooglyEye): Point {
    return drag?.eyeId === eye.id ? drag.at : fromDrawing(eye);
  }

  function frame(now: number) {
    const dt = lastFrame === undefined ? 0 : Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image) ctx.drawImage(image, box.x, box.y, box.width, box.height);

    const r = radius();
    for (const eye of core().eyes()) {
      const at = shownAt(eye);
      // Dragging an eye around rattles its pupil, like shaking a real googly eye.
      let pupil = pupils.get(eye.id);
      if (!pupil) pupils.set(eye.id, (pupil = createPupil()));
      // In CSS pixels, which are about the size of arena units, for the same feel.
      pupil.follow(dt, { x: at.x / dpr, y: at.y / dpr });
      const born = bornAt.get(eye.id);
      const pop = born === undefined ? 1 : popScale(Math.min(1, (now - born) / 1000 / POP_SECONDS));
      const off = drag?.eyeId === eye.id && drag.off;
      drawGooglyEye(ctx, at.x, at.y, r * pop * (off ? 0.8 : 1), { pupil: pupil.offset, alpha: off ? 0.4 : 1 });
    }
    frameId = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => {
    if (!root.hidden) resize();
  });

  return {
    show(drawn) {
      image = drawn;
      drag = undefined;
      pupils.clear();
      bornAt.clear();
      nameInput.value = core().name();
      root.hidden = false;
      resize();
      update();
      lastFrame = undefined;
      if (frameId === undefined) frameId = requestAnimationFrame(frame);
    },
    hide() {
      root.hidden = true;
      nameInput.blur();
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      frameId = undefined;
    },
  };
}

/**
 * Where `el`'s top-left sits inside `ancestor`, in untransformed CSS pixels.
 * Layout offsets ignore CSS transforms, so this holds whichever way the app is
 * turned (unlike `getBoundingClientRect`, which gives the rotated bounding box).
 * Chromium has no transform-aware "point from node" API to use instead.
 * `ancestor` must be positioned, so the offset-parent chain passes through it.
 */
function layoutOffset(el: HTMLElement, ancestor: HTMLElement): Point {
  let x = 0;
  let y = 0;
  for (let at: Element | null = el; at instanceof HTMLElement && at !== ancestor; at = at.offsetParent) {
    x += at.offsetLeft;
    y += at.offsetTop;
  }
  return { x, y };
}

/** 0 → 1 with a little overshoot, for an eye popping on. */
function popScale(t: number): number {
  const s = 1.7;
  const u = t - 1;
  return 1 + u * u * ((s + 1) * u + s);
}
