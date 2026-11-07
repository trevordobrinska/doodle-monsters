import type { Clock, Dice } from "./deps";
import { BEHAVIORS, tighten, type Behavior, type Temperament } from "./temperaments";
import { NAME_WORDS } from "./nameWords";

export interface Arena {
  readonly width: number;
  readonly height: number;
}

/** What the outside world can see of the Monster. */
export interface MonsterView {
  readonly x: number;
  readonly y: number;
  /**
   * The Monster's size in arena units: its drawing is shown in this box,
   * centred on x, y. It bounces off walls at the box's edges, and taps
   * anywhere in the oval that fills the box land on it.
   */
  readonly width: number;
  readonly height: number;
  /** The name of the color the Monster was mostly drawn in, e.g. "purple". */
  readonly mainColor: string;
  /** Undefined until the kid picks one while bringing it to life. */
  readonly temperament: Temperament | undefined;
  readonly eyes: readonly GooglyEye[];
  readonly name: string;
  /** Velocity in pixels per second. Zero while Stunned. */
  readonly vx: number;
  readonly vy: number;
  /** Steps of Dizzy built up so far. */
  readonly dizzy: number;
  /** Steps of Dizzy that make the Monster fully Dizzy. */
  readonly fullDizzy: number;
  readonly stunned: boolean;
  /** Flung by a Flick and flying towards a wall. */
  readonly flying: boolean;
  /** Fully Dizzy (spiral eyes): one more tap catches it. */
  readonly readyToCatch: boolean;
  /** Worn out after a long Catch, so it moves slower. */
  readonly sleepy: boolean;
  /** Caught in its bubble. The Catch is over. */
  readonly caught: boolean;
  /**
   * How this Monster's sounds are pitched, as a playback-rate multiplier
   * (1 = as recorded). Chosen once, so the Monster keeps its own voice.
   */
  readonly voice: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** What a tap did: a Bonk, a "boing" on a Stunned Monster, a catch, or nothing. */
export type TapResult = "bonk" | "boing" | "caught" | "miss";

/** What a Flick did: flung the Monster, a "boing" on a Stunned Monster, a catch, or nothing. */
export type FlickResult = "flick" | "boing" | "caught" | "miss";

/**
 * What happened during a tick: a flung Monster hit the wall, or nothing worth
 * reporting. Ordinary bounces off the walls aren't reported.
 */
export type TickResult = "wallHit" | "none";

/** Where the Round is: drawing the Monster, bringing it to life, or catching it. */
export type Phase = "draw" | "bringToLife" | "catch";

/** What the drawing screen tells the core about a finished drawing. */
export interface InkFacts {
  /** Size of the drawing trimmed to its ink, in drawing-screen pixels. */
  readonly width: number;
  readonly height: number;
  /** How much ink was laid down, in square drawing-screen pixels. */
  readonly inkAmount: number;
  /** The name of the color with the most ink, e.g. "purple". */
  readonly mainColor: string;
}

/**
 * A Googly Eye stuck on the drawing. Its position is relative to the
 * drawing's box: 0,0 is the top-left corner and 1,1 the bottom-right, so it
 * stays put however big the Monster is shown.
 */
export interface GooglyEye {
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

export interface GameCore {
  readonly arena: Arena;
  phase(): Phase;
  /** Whether a drawing has enough ink to become a Monster. The drawing screen asks this to enable "Done". */
  enoughInk(inkAmount: number): boolean;
  /**
   * The kid pressed "Done". Moves the Round from Draw to Bring to life,
   * unless there isn't enough ink yet. Returns whether it moved on.
   */
  finishDrawing(ink: InkFacts): boolean;
  /** The Googly Eyes stuck on the Monster so far. */
  eyes(): readonly GooglyEye[];
  /**
   * Sticks a Googly Eye on the drawing, at a point relative to its box.
   * Returns the new eye, or undefined if it already has the most eyes allowed.
   */
  placeEye(at: Point): GooglyEye | undefined;
  /** Moves a Googly Eye to a new point relative to the drawing's box. */
  moveEye(id: number, to: Point): void;
  removeEye(id: number): void;
  pickTemperament(temperament: Temperament): void;
  /** Hard mode tightens every Temperament, for older kids. */
  setHardMode(on: boolean): void;
  hardMode(): boolean;
  /** The Monster's name, as generated or typed. Empty until its drawing is done. */
  name(): string;
  /** 🎲: swaps the name for a different generated one. */
  rerollName(): void;
  /** The kid typed a name. Very long names are cut short. */
  setName(typed: string): void;
  /** Whether the Monster has everything it needs for its Catch to begin. */
  canStartCatch(): boolean;
  /** Moves the Round from Bring to life to the Catch, if it can start. Returns whether it moved on. */
  startCatch(): boolean;
  /** Advances the game by `dt` seconds. */
  tick(dt: number): TickResult;
  monster(): MonsterView;
  /** A tap at a point in arena coordinates. The core decides whether it hit. */
  bonk(at: Point): TapResult;
  /**
   * A quick swipe along a path in arena coordinates. The core decides
   * whether the path crossed the Monster.
   */
  flick(path: readonly Point[]): FlickResult;
}

export interface GameCoreDeps {
  clock: Clock;
  dice: Dice;
}

/** Landscape Fire HD 8 resolution: the size every rule is designed against. */
const ARENA: Arena = { width: 1280, height: 800 };

/**
 * Every Monster's longest side, in arena units, however big it was drawn,
 * so a tiny or huge drawing doesn't make a Catch unfair.
 */
const MONSTER_SIZE = 150;
/** Taps this far outside the Monster's edge still land, for small fingers. */
const TOUCH_SLOP = 16;
const FULL_DIZZY = 6;
/** How long the dash boost takes to fade back to normal speed. */
const DASH_SECONDS = 1.5;
/** A zigzagging Monster heads off somewhere new this often... */
const ZIGZAG_SECONDS = 1.2;
/** ...turning by somewhere between these many degrees. */
const ZIGZAG_TURN = { min: 40, max: 110 };
/** One hop of a hopping Monster takes this long... */
const HOP_SECONDS = 0.5;
/** ...slowing to this fraction of its speed between hops and peaking at this much mid-hop. */
const HOP_SPEED = { least: 0.25, most: 1.45 };
/** Dizzy starts draining after this long without a Bonk, then loses a step as often as the Temperament says. */
const DRAIN_DELAY_SECONDS = 3;
/** How fast a Flick flings the Monster towards a wall. */
const FLICK_SPEED = 1600; // pixels per second
/** A Flick counts as two Bonks: a design rule, not a tuning number. */
const FLICK_DIZZY_STEPS = 2;
/**
 * A Catch can't fail: after this long the Monster gets sleepy, and its Dizzy
 * stops draining, so even the slowest taps add up...
 */
const SLEEPY_AFTER_SECONDS = 120;
/** ...and over this long slows down to this fraction of its speed. */
const SLEEPY_SLOWDOWN_SECONDS = 10;
const SLEEPY_SPEED = 0.5;
/** Voices range from a bit lower to a bit higher than the recorded sounds. */
const LOWEST_VOICE = 0.8;
const HIGHEST_VOICE = 1.25;

/** A Monster has 1 to 5 Googly Eyes: a design rule. */
const MIN_EYES = 1;
export const MAX_EYES = 5;
/** Long enough for any silly name, short enough to fit on a Name Card. */
const MAX_NAME_LENGTH = 24;

/**
 * Ink needed before "Done" works, in square drawing-screen pixels: about a
 * hand-span of thin line, so a single dot or tap can't become a Monster.
 */
const MIN_INK = 6000;

export function createGameCore({ dice }: GameCoreDeps): GameCore {
  const arena = ARENA;

  // Start in the middle, heading diagonally-ish (20°–70° off the axes)
  // so the Monster reaches every wall rather than sliding along one.
  const angle = ((20 + dice.roll() * 50) * Math.PI) / 180;
  const randomSign = () => (dice.roll() < 0.5 ? -1 : 1);
  let x = arena.width / 2;
  let y = arena.height / 2;
  // Unit vector the Monster is heading along.
  let dirX = Math.cos(angle) * randomSign();
  let dirY = Math.sin(angle) * randomSign();
  const voice = LOWEST_VOICE + dice.roll() * (HIGHEST_VOICE - LOWEST_VOICE);
  let dizzy = 0;
  let stunnedLeft = 0; // seconds of Stunned still to go
  let flying = false; // flung by a Flick, heading along dirX/dirY until a wall
  let dashLeft = 0; // seconds of dash boost still to go
  let drainIn = 0; // seconds until Dizzy next loses a step
  let zigzagIn = ZIGZAG_SECONDS; // seconds until a zigzagging Monster turns
  let caught = false;
  let catchSeconds = 0; // how long this Catch has been going
  const readyToCatch = () => dizzy >= FULL_DIZZY;
  const sleepy = () => catchSeconds >= SLEEPY_AFTER_SECONDS;
  let phase: Phase = "draw";
  let width = 0;
  let height = 0;
  let mainColor = "";
  let eyes: GooglyEye[] = [];
  let nextEyeId = 1;
  let temperament: Temperament | undefined;
  let name = "";
  let hardMode = false;
  /** How it behaves during its Catch: its Temperament's, tightened in hard mode. */
  function behavior(): Behavior {
    // Only asked once the Catch has begun, which needs a Temperament; the
    // fallback just keeps the types happy.
    const own = BEHAVIORS[temperament ?? "speedy"];
    return hardMode ? tighten(own) : own;
  }
  const bringingToLife = () => phase === "bringToLife";
  const canStartCatch = () => bringingToLife() && eyes.length >= MIN_EYES && temperament !== undefined && name.trim() !== "";
  /** There's a Monster to Bonk and Flick: its Catch has begun and isn't over. */
  const inPlay = () => phase === "catch" && !caught;
  const halfW = () => width / 2;
  const halfH = () => height / 2;

  function speed() {
    if (stunnedLeft > 0 || caught) return 0;
    if (flying) return FLICK_SPEED;
    const { speed, dashBoost } = behavior();
    return speed * (1 + dashBoost * (dashLeft / DASH_SECONDS)) * hopping() * sleepiness();
  }

  /** A hopping Monster's speed rises and falls with each hop. Others keep a steady 1. */
  function hopping() {
    if (behavior().wander !== "hop") return 1;
    const midHop = Math.abs(Math.sin((Math.PI * catchSeconds) / HOP_SECONDS));
    return HOP_SPEED.least + (HOP_SPEED.most - HOP_SPEED.least) * midHop;
  }

  /** A zigzagging Monster turns off to one side or the other every so often. */
  function zigzag(dt: number) {
    if (behavior().wander !== "zigzag") return;
    zigzagIn -= dt;
    if (zigzagIn > 0) return;
    zigzagIn += ZIGZAG_SECONDS;
    const turn = ((ZIGZAG_TURN.min + dice.roll() * (ZIGZAG_TURN.max - ZIGZAG_TURN.min)) * Math.PI) / 180;
    const heading = Math.atan2(dirY, dirX) + turn * randomSign();
    dirX = Math.cos(heading);
    dirY = Math.sin(heading);
  }

  /** 1 while wide awake, easing down to SLEEPY_SPEED once the Catch runs long. */
  function sleepiness() {
    const drowsy = (catchSeconds - SLEEPY_AFTER_SECONDS) / SLEEPY_SLOWDOWN_SECONDS;
    return 1 - (1 - SLEEPY_SPEED) * Math.min(1, Math.max(0, drowsy));
  }

  function dashOff() {
    const dashAngle = dice.roll() * Math.PI * 2;
    dirX = Math.cos(dashAngle);
    dirY = Math.sin(dashAngle);
    dashLeft = DASH_SECONDS;
  }

  /** Moves along the Flick until it meets a wall, then it's Stunned there. */
  function flyTowardsWall(dt: number): TickResult {
    const step = FLICK_SPEED * dt;
    const toWallX = distanceToWall(x, dirX, halfW(), arena.width - halfW());
    const toWallY = distanceToWall(y, dirY, halfH(), arena.height - halfH());
    const travel = Math.min(step, toWallX, toWallY);
    x += dirX * travel;
    y += dirY * travel;
    if (travel < step) {
      flying = false;
      stunnedLeft = behavior().stunnedSeconds;
      return "wallHit";
    }
    return "none";
  }

  /**
   * The rules a Bonk and a Flick share once they've hit: nothing new while
   * Stunned or flying, and a catch once fully Dizzy. Undefined means the hit
   * goes on to add Dizzy.
   */
  function hitWithoutDizzy(): "boing" | "caught" | undefined {
    if (stunnedLeft > 0 || flying) return "boing";
    if (readyToCatch()) {
      caught = true;
      return "caught";
    }
    return undefined;
  }

  /**
   * Whether a tap (one point) or a swipe lands on the Monster's oval, with
   * TOUCH_SLOP of slack all round. Squashing the arena so the oval becomes a
   * unit circle turns this into a circle test.
   */
  function crossesMonster(path: readonly Point[]): boolean {
    const rx = halfW() + TOUCH_SLOP;
    const ry = halfH() + TOUCH_SLOP;
    const squashed = path.map((p) => ({ x: (p.x - x) / rx, y: (p.y - y) / ry }));
    return crossesCircle(squashed, { x: 0, y: 0 }, 1);
  }

  function drainDizzy(dt: number) {
    // A fully Dizzy Monster waits for its catching tap rather than recovering,
    // and a sleepy one is too tired to recover.
    if (dizzy === 0 || readyToCatch() || sleepy()) return;
    drainIn -= dt;
    while (drainIn <= 0 && dizzy > 0) {
      dizzy -= 1;
      drainIn += behavior().drainStepSeconds;
    }
  }

  return {
    arena,
    phase: () => phase,
    enoughInk: (inkAmount) => inkAmount >= MIN_INK,
    finishDrawing(ink) {
      if (phase !== "draw" || ink.inkAmount < MIN_INK || !(ink.width > 0 && ink.height > 0)) return false;
      const fit = MONSTER_SIZE / Math.max(ink.width, ink.height);
      width = ink.width * fit;
      height = ink.height * fit;
      mainColor = ink.mainColor;
      phase = "bringToLife";
      name = generateName(dice);
      return true;
    },
    eyes: () => eyes,
    placeEye(at) {
      if (!bringingToLife() || eyes.length >= MAX_EYES) return undefined;
      const eye = { id: nextEyeId++, ...onDrawing(at) };
      eyes = [...eyes, eye];
      return eye;
    },
    moveEye(id, to) {
      if (!bringingToLife()) return;
      eyes = eyes.map((eye) => (eye.id === id ? { id, ...onDrawing(to) } : eye));
    },
    removeEye(id) {
      if (!bringingToLife()) return;
      eyes = eyes.filter((eye) => eye.id !== id);
    },
    pickTemperament(picked) {
      if (bringingToLife()) temperament = picked;
    },
    setHardMode(on) {
      hardMode = on;
    },
    hardMode: () => hardMode,
    name: () => name,
    rerollName() {
      if (!bringingToLife()) return;
      const before = name;
      // Rolling the same name again would look like 🎲 didn't work. The
      // limit is only for word lists so short they make a single name.
      for (let tries = 0; name === before && tries < 100; tries++) name = generateName(dice);
    },
    setName(typed) {
      if (bringingToLife()) name = typed.slice(0, MAX_NAME_LENGTH);
    },
    canStartCatch,
    startCatch() {
      if (!canStartCatch()) return false;
      name = name.trim();
      phase = "catch";
      return true;
    },
    tick(dt) {
      if (!inPlay()) return "none";
      catchSeconds += dt;
      drainDizzy(dt);
      if (stunnedLeft > 0) {
        stunnedLeft = Math.max(0, stunnedLeft - dt);
        if (stunnedLeft === 0) dashOff();
        return "none";
      }
      if (flying) return flyTowardsWall(dt);
      zigzag(dt);
      const frameSpeed = speed();
      dashLeft = Math.max(0, dashLeft - dt);
      x += dirX * frameSpeed * dt;
      y += dirY * frameSpeed * dt;
      ({ pos: x, dir: dirX } = bounce(x, dirX, halfW(), arena.width - halfW()));
      ({ pos: y, dir: dirY } = bounce(y, dirY, halfH(), arena.height - halfH()));
      return "none";
    },
    monster: () => ({
      x,
      y,
      width,
      height,
      mainColor,
      temperament,
      eyes,
      name,
      vx: dirX * speed(),
      vy: dirY * speed(),
      dizzy,
      fullDizzy: FULL_DIZZY,
      stunned: stunnedLeft > 0,
      flying,
      readyToCatch: readyToCatch(),
      sleepy: sleepy(),
      caught,
      voice,
    }),
    bonk(at) {
      if (!inPlay() || !crossesMonster([at])) return "miss";
      const early = hitWithoutDizzy();
      if (early) return early;
      dizzy += 1;
      drainIn = DRAIN_DELAY_SECONDS;
      stunnedLeft = behavior().stunnedSeconds;
      return "bonk";
    },
    flick(path) {
      if (!inPlay() || !crossesMonster(path)) return "miss";
      const dx = path[path.length - 1].x - path[0].x;
      const dy = path[path.length - 1].y - path[0].y;
      const length = Math.hypot(dx, dy);
      if (length === 0) return "miss";
      const early = hitWithoutDizzy();
      if (early) return early;
      dizzy = Math.min(FULL_DIZZY, dizzy + FLICK_DIZZY_STEPS);
      drainIn = DRAIN_DELAY_SECONDS;
      dirX = dx / length;
      dirY = dy / length;
      dashLeft = 0;
      flying = true;
      return "flick";
    },
  };
}

/** Fills a name template's {blanks} from the word lists, choosing with the dice. */
function generateName(dice: Dice): string {
  const pick = (words: readonly string[]) => words[Math.floor(dice.roll() * words.length)];
  return pick(NAME_WORDS.templates).replace(/\{(\w+)\}/g, (_, list: keyof typeof NAME_WORDS) => pick(NAME_WORDS[list]));
}

/** Keeps a point relative to the drawing's box inside the box. */
function onDrawing(p: Point): Point {
  return { x: Math.min(1, Math.max(0, p.x)), y: Math.min(1, Math.max(0, p.y)) };
}

/** Whether any leg of the path comes within `radius` of `centre`. */
function crossesCircle(path: readonly Point[], centre: Point, radius: number): boolean {
  if (path.length === 1) return Math.hypot(path[0].x - centre.x, path[0].y - centre.y) <= radius;
  for (let i = 1; i < path.length; i++) {
    if (distanceToSegment(centre, path[i - 1], path[i]) <= radius) return true;
  }
  return false;
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** How far a position can travel along `dir` (along one axis) before it meets min or max. */
function distanceToWall(pos: number, dir: number, min: number, max: number): number {
  if (dir > 0) return (max - pos) / dir;
  if (dir < 0) return (min - pos) / dir;
  return Infinity;
}

/**
 * Folds a position back between two walls, however far past them it went,
 * like a ray bouncing between two mirrors. `dir` is the direction (sign) it
 * moved in this frame; the result's direction is flipped if it ended on a
 * leg heading back the other way.
 */
function bounce(pos: number, dir: number, min: number, max: number) {
  const span = max - min;
  let offset = (pos - min) % (span * 2);
  if (offset < 0) offset += span * 2;
  return offset <= span
    ? { pos: min + offset, dir }
    : { pos: max - (offset - span), dir: -dir };
}
