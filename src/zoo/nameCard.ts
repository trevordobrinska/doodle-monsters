import type { ZooMonsterView } from "../core/gameCore";
import { TEMPERAMENTS } from "../core/temperaments";
import { drawGooglyEye, eyeRadius } from "../render/googlyEyes";

/**
 * A Zoo Monster's Name Card, opened by tapping it: its name, a large
 * picture, the date it was drawn, its Temperament and its Bio. Say Goodbye
 * needs a press and hold; letting go early cancels. Holds no game rules:
 * the core does the goodbye.
 */
export interface NameCardOptions {
  /** The kid held Say Goodbye all the way: the Monster is leaving. The card has closed. */
  onGoodbye(id: string): void;
}

export interface NameCard {
  show(monster: ZooMonsterView): void;
  hide(): void;
}

/** How long Say Goodbye must be held. Long enough not to happen by accident. */
const HOLD_SECONDS = 1.5;
/** The picture's canvas size in CSS pixels; drawn sharper on high-density screens. */
const PICTURE_SIZE = 280;

export function createNameCard(root: HTMLElement, options: NameCardOptions): NameCard {
  root.innerHTML = `
    <div class="card" role="dialog" aria-modal="true">
      <button class="close" aria-label="Close">✖</button>
      <canvas class="picture"></canvas>
      <div class="details">
        <h1 class="name"></h1>
        <div class="drawn"></div>
        <div class="temperament"></div>
        <p class="bio"></p>
        <button class="goodbye"><span class="fill"></span><span class="label">👋 Say Goodbye</span></button>
        <div class="goodbye-hint">Hold to Say Goodbye</div>
      </div>
    </div>
  `;
  const picture = root.querySelector<HTMLCanvasElement>(".picture")!;
  const nameEl = root.querySelector<HTMLElement>(".name")!;
  const drawnEl = root.querySelector<HTMLElement>(".drawn")!;
  const temperamentEl = root.querySelector<HTMLElement>(".temperament")!;
  const bioEl = root.querySelector<HTMLElement>(".bio")!;
  const closeButton = root.querySelector<HTMLButtonElement>(".close")!;
  const goodbyeButton = root.querySelector<HTMLButtonElement>(".goodbye")!;
  const fill = root.querySelector<HTMLElement>(".fill")!;
  fill.style.transitionDuration = `${HOLD_SECONDS}s`;

  let shown: ZooMonsterView | undefined;
  /** Bumped every time the card opens, so a slow-decoding picture can't land on a newer card. */
  let opened = 0;
  let hold: { pointerId: number; timer: number } | undefined;

  function show(monster: ZooMonsterView) {
    shown = monster;
    const mine = ++opened;
    cancelHold();
    nameEl.textContent = monster.name;
    drawnEl.textContent = `Drawn on ${new Date(monster.drawnAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`;
    const temperament = TEMPERAMENTS.find((t) => t.id === monster.temperament);
    temperamentEl.textContent = temperament ? `${temperament.icon} ${temperament.word}` : "";
    bioEl.textContent = monster.bio;
    const ctx = picture.getContext("2d")!;
    ctx.clearRect(0, 0, picture.width, picture.height);
    createImageBitmap(monster.image).then(
      (bitmap) => {
        if (mine === opened) drawPicture(bitmap, monster);
      },
      (error) => console.error(`Couldn't show ${monster.name}'s drawing`, error),
    );
    root.hidden = false;
  }

  function hide() {
    cancelHold();
    shown = undefined;
    root.hidden = true;
  }

  /** The drawing as big as fits, with its Googly Eyes stuck on, looking straight out. */
  function drawPicture(image: ImageBitmap, monster: ZooMonsterView) {
    const dpr = window.devicePixelRatio || 1;
    picture.width = PICTURE_SIZE * dpr;
    picture.height = PICTURE_SIZE * dpr;
    const ctx = picture.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Keep the drawing's shape: its longest side fills the picture, with room for eyes at the edge.
    const fit = (PICTURE_SIZE * 0.86) / Math.max(monster.width, monster.height);
    const width = monster.width * fit;
    const height = monster.height * fit;
    const left = (PICTURE_SIZE - width) / 2;
    const top = (PICTURE_SIZE - height) / 2;
    ctx.drawImage(image, left, top, width, height);
    const r = eyeRadius(width, height);
    for (const eye of monster.eyes) {
      drawGooglyEye(ctx, left + eye.x * width, top + eye.y * height, r, { pupil: { x: 0, y: 0 } });
    }
  }

  function startHold(event: PointerEvent) {
    if (!shown || hold) return;
    goodbyeButton.setPointerCapture(event.pointerId);
    goodbyeButton.classList.add("holding");
    hold = { pointerId: event.pointerId, timer: window.setTimeout(goodbye, HOLD_SECONDS * 1000) };
  }

  function cancelHold() {
    if (hold) window.clearTimeout(hold.timer);
    hold = undefined;
    goodbyeButton.classList.remove("holding");
  }

  function goodbye() {
    const leaving = shown;
    hide();
    if (leaving) options.onGoodbye(leaving.id);
  }

  goodbyeButton.addEventListener("pointerdown", startHold);
  const letGo = (event: PointerEvent) => {
    if (hold?.pointerId === event.pointerId) cancelHold();
  };
  goodbyeButton.addEventListener("pointerup", letGo);
  goodbyeButton.addEventListener("pointercancel", letGo);
  goodbyeButton.addEventListener("lostpointercapture", letGo);
  // A long press would otherwise open the tablet's own menu.
  goodbyeButton.addEventListener("contextmenu", (event) => event.preventDefault());
  closeButton.addEventListener("click", hide);
  // Tapping outside the card closes it too.
  root.addEventListener("click", (event) => {
    if (event.target === root) hide();
  });

  return { show, hide };
}
