import type { Clock, Dice } from "./deps";
import { BEHAVIORS, TEMPERAMENTS, tighten, type Behavior, type Temperament } from "./temperaments";
import { NAME_WORDS } from "./nameWords";
import { BIO_WORDS } from "./bioWords";
import { MONSTER_SCHEMA_VERSION, type MonsterRecord, type ZooStorage } from "./zooStorage";

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

/**
 * Where the app is: in the Zoo between Rounds, or in a Round drawing the
 * Monster, bringing it to life, or catching it.
 */
export type Phase = "zoo" | "draw" | "bringToLife" | "catch";

/** A Monster living in the Zoo, wandering its Habitat. */
export interface ZooMonsterView {
  readonly id: string;
  readonly name: string;
  /** The kid's drawing, trimmed to its ink. */
  readonly image: Blob;
  readonly temperament: Temperament;
  readonly mainColor: string;
  readonly eyes: readonly GooglyEye[];
  /** When its drawing was finished, as an ISO 8601 date and time. */
  readonly drawnAt: string;
  /** Its short, silly Bio, written once when it was caught. Empty while Napping. */
  readonly bio: string;
  /**
   * Which Habitat it lives in, counting from 0. It stays there: catching
   * and Saying Goodbye never move the others about.
   */
  readonly habitat: number;
  /** Where it is in its Habitat, which is the same size as the arena. */
  readonly x: number;
  readonly y: number;
  /** Its size in arena units, as during its Catch. */
  readonly width: number;
  readonly height: number;
  /** Velocity in pixels per second. Zero while Napping. */
  readonly vx: number;
  readonly vy: number;
  /** Its Catch was left unfinished: it sleeps (💤) until the kid taps it to resume. */
  readonly napping: boolean;
  /** The kid Said Goodbye: it waves, then walks out of the Habitat, and is gone. */
  readonly leaving: boolean;
  /** Saying Goodbye, and still waving before it walks away. */
  readonly waving: boolean;
}

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
  /**
   * Brings back the Zoo saved on the device, putting its Monsters in their
   * Habitat. Call once when the app opens, before showing the Zoo.
   */
  loadZoo(): Promise<void>;
  /** Every Monster in the Zoo, Napping ones included, in every Habitat. */
  zoo(): readonly ZooMonsterView[];
  /**
   * How many Habitats the Zoo is split into. Each holds about 10 Monsters
   * at most, so the screen never gets too crowded. Always at least one.
   */
  habitatCount(): number;
  /** Which Habitat the kid is looking at, counting from 0. */
  shownHabitat(): number;
  /** The Monsters in the Habitat the kid is looking at. */
  monstersShown(): readonly ZooMonsterView[];
  /** The kid moves to another Habitat. Returns whether it's a Habitat there is. */
  showHabitat(index: number): boolean;
  /** Settles once everything changed so far is saved. Rejects if saving failed. */
  saved(): Promise<void>;
  /**
   * The kid left mid-Catch (the app was hidden, closed or navigated away
   * from): the Monster goes to the Zoo Napping. Returns whether it went.
   */
  leave(): boolean;
  /** The Zoo Monster at a point in the Habitat shown (the one in front, if several), or undefined. */
  zooMonsterAt(at: Point): ZooMonsterView | undefined;
  /** The kid tapped a Napping Monster: back to its Catch. Returns whether it resumed. */
  resume(id: string): boolean;
  /**
   * Say Goodbye, from a Monster's Name Card: the only way a Monster ever
   * leaves the Zoo. It's gone from storage at once, then waves and walks
   * out of the Habitat. Returns whether it's going.
   */
  sayGoodbye(id: string): boolean;
  /** "Draw a Monster!": starts a new Round from the Zoo. Returns whether it started. */
  startRound(): boolean;
  /** After the Catch, the caught Monster's kid goes back to the Zoo. Returns whether it went. */
  goToZoo(): boolean;
  /** Whether a drawing has enough ink to become a Monster. The drawing screen asks this to enable "Done". */
  enoughInk(inkAmount: number): boolean;
  /**
   * The kid pressed "Done". Moves the Round from Draw to Bring to life,
   * unless there isn't enough ink yet. Returns whether it moved on.
   */
  finishDrawing(ink: InkFacts, image: Blob): boolean;
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
  /** Advances the game by `dt` seconds: the Catch, or the Monsters wandering the Zoo. */
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
  storage: ZooStorage;
}

/** What one Round looks after: a single Monster, from its drawing to its Catch. */
interface Round
  extends Pick<
    GameCore,
    | "eyes"
    | "placeEye"
    | "moveEye"
    | "removeEye"
    | "pickTemperament"
    | "name"
    | "rerollName"
    | "setName"
    | "canStartCatch"
    | "startCatch"
    | "tick"
    | "monster"
    | "bonk"
    | "flick"
  > {
  phase(): Exclude<Phase, "zoo">;
  finishDrawing(ink: InkFacts): boolean;
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

/**
 * One Round's Monster. `hardMode` is asked each time, as the kid can flip it
 * between Rounds. Given a Napping Monster, the Round resumes its Catch, with
 * Dizzy starting fresh.
 */
function createRound(dice: Dice, hardMode: () => boolean, napping?: MonsterRecord): Round {
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
  let phase: Exclude<Phase, "zoo"> = "draw";
  let width = 0;
  let height = 0;
  let mainColor = "";
  let eyes: GooglyEye[] = [];
  let nextEyeId = 1;
  let temperament: Temperament | undefined;
  let name = "";
  if (napping) {
    ({ width, height } = monsterSize(napping.drawingSize));
    mainColor = napping.mainColor;
    eyes = napping.eyes.map(({ x, y }) => ({ id: nextEyeId++, x, y }));
    temperament = napping.temperament;
    name = napping.name;
    phase = "catch";
  }
  /** How it behaves during its Catch: its Temperament's, tightened in hard mode. */
  function behavior(): Behavior {
    // Only asked once the Catch has begun, which needs a Temperament; the
    // fallback just keeps the types happy.
    const own = BEHAVIORS[temperament ?? "speedy"];
    return hardMode() ? tighten(own) : own;
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

  /** Whether a tap (one point) or a swipe lands on the Monster. */
  function crossesMonster(path: readonly Point[]): boolean {
    return crossesOval(path, { x, y }, width, height);
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
    phase: () => phase,
    finishDrawing(ink) {
      if (phase !== "draw" || ink.inkAmount < MIN_INK || !(ink.width > 0 && ink.height > 0)) return false;
      ({ width, height } = monsterSize(ink));
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

/** Zoo Monsters stroll: this fraction of their Catch speed. */
const HABITAT_PACE = 0.3;
/** A wandering Zoo Monster heads off somewhere new every this many seconds or so... */
const HABITAT_TURN_SECONDS = { min: 2, max: 5 };
/** ...turning by up to this many degrees either way. */
const HABITAT_MAX_TURN = 70;

/** The most Monsters a Habitat holds, so the screen stays uncrowded and smooth. */
const HABITAT_SIZE = 10;

/** A Monster Saying Goodbye waves for this many seconds... */
const GOODBYE_WAVE_SECONDS = 1.5;
/** ...then walks out of the nearer side of the Habitat at this speed, in pixels per second. */
const GOODBYE_WALK_SPEED = 160;

/** A Monster Saying Goodbye: seconds of waving left, then which way it walks off. */
interface Goodbye {
  waveLeft: number;
  dirX: number;
}

/** A Monster in the Zoo: its saved record plus where it is in the Habitat. */
interface HabitatMonster {
  record: MonsterRecord;
  eyes: readonly GooglyEye[];
  width: number;
  height: number;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  turnIn: number;
  /** Set once the kid Says Goodbye. */
  goodbye?: Goodbye;
}

export function createGameCore({ clock, dice, storage }: GameCoreDeps): GameCore {
  const arena = ARENA;
  let hardMode = false;
  let round = createRound(dice, () => hardMode);
  let inZoo = true;
  /** What the Round's Monster will be saved with, from its finished drawing. */
  let drawing: { image: Blob; size: { width: number; height: number }; drawnAt: string } | undefined;
  /**
   * The Monster being caught, as saved. It's saved Napping the moment its
   * Catch begins, so it's never lost however the kid leaves, even if the
   * tablet closes the app without warning.
   */
  let catching: MonsterRecord | undefined;
  /** The Zoo, split into Habitats. A Monster stays in its Habitat until it leaves. */
  let habitats: HabitatMonster[][] = [[]];
  /** Which Habitat the kid is looking at. */
  let shown = 0;
  let saving: Promise<void> = Promise.resolve();
  /** Monsters the kid Said Goodbye to, so loading the Zoo again never brings one back. */
  const goneIds = new Set<string>();

  const randomSign = () => (dice.roll() < 0.5 ? -1 : 1);
  const turnDelay = () => HABITAT_TURN_SECONDS.min + dice.roll() * (HABITAT_TURN_SECONDS.max - HABITAT_TURN_SECONDS.min);

  /** Puts a Monster in the Habitat at a point, heading off in a random direction. */
  function intoHabitat(record: MonsterRecord, at: Point): HabitatMonster {
    const { width, height } = monsterSize(record.drawingSize);
    const heading = dice.roll() * Math.PI * 2;
    return {
      record,
      eyes: record.eyes.map((eye, i) => ({ id: i + 1, x: eye.x, y: eye.y })),
      width,
      height,
      x: Math.min(arena.width - width / 2, Math.max(width / 2, at.x)),
      y: Math.min(arena.height - height / 2, Math.max(height / 2, at.y)),
      dirX: Math.cos(heading),
      dirY: Math.sin(heading),
      speed: BEHAVIORS[record.temperament].speed * HABITAT_PACE,
      turnIn: turnDelay(),
    };
  }

  const everyone = () => habitats.flat();
  const hasRoom = (habitat: readonly HabitatMonster[]) => habitat.filter((h) => !h.goodbye).length < HABITAT_SIZE;

  /**
   * A Monster arrives in the Zoo. It goes into the Habitat it's kept in, if
   * there's room; else the Habitat shown, if there's room (so the kid sees
   * it arrive); else the first with room; else a new Habitat. Nobody else
   * moves. Its record notes the Habitat, to save. Returns the Habitat.
   */
  function settle(h: HabitatMonster, preferShown: boolean): number {
    const kept = h.record.habitat;
    while (kept !== undefined && kept >= habitats.length) habitats = [...habitats, []];
    let index =
      kept !== undefined && hasRoom(habitats[kept])
        ? kept
        : preferShown && hasRoom(habitats[shown])
          ? shown
          : habitats.findIndex(hasRoom);
    if (index < 0) {
      habitats = [...habitats, []];
      index = habitats.length - 1;
    }
    habitats[index] = [...habitats[index], h];
    h.record = { ...h.record, schemaVersion: MONSTER_SCHEMA_VERSION, habitat: index };
    return index;
  }

  /** Takes a Monster out of its Habitat. The Habitat stays, even if it's now empty. */
  function unsettle(h: HabitatMonster) {
    habitats = habitats.map((habitat) => habitat.filter((other) => other !== h));
  }

  const find = (id: string) => everyone().find((h) => h.record.id === id);

  /** One change to storage after another, and one failing doesn't stop the next. */
  function store(change: () => Promise<void>) {
    saving = saving.catch(() => {}).then(change);
  }
  const save = (record: MonsterRecord) => store(() => storage.save(record));

  /** The Round's Catch just began: its Monster is saved, Napping until it's caught. */
  function saveNapping() {
    const m = round.monster();
    if (!drawing || !m.temperament) return;
    catching = {
      schemaVersion: MONSTER_SCHEMA_VERSION,
      id: newId(dice),
      name: m.name,
      image: drawing.image,
      drawingSize: drawing.size,
      eyes: m.eyes.map(({ x, y }) => ({ x, y })),
      temperament: m.temperament,
      bio: "",
      mainColor: m.mainColor,
      drawnAt: drawing.drawnAt,
      status: "napping",
    };
    save(catching);
  }

  /** The Round's Monster was just caught: it moves into the Zoo, for good. */
  function moveIntoZoo() {
    if (!catching) return;
    // The Bio is written once, now, and kept with the Monster for good.
    const h = intoHabitat({ ...catching, bio: generateBio(dice, catching), status: "zoo" }, round.monster());
    catching = undefined;
    shown = settle(h, true);
    save(h.record);
  }

  /**
   * A Zoo Monster saved before Bios were written (ticket 11) gets its Bio
   * now, saved so it's the same one from then on.
   */
  function withBio(record: MonsterRecord): MonsterRecord {
    if (record.status !== "zoo" || record.bio !== "") return record;
    const written = { ...record, bio: generateBio(dice, record) };
    save(written);
    return written;
  }

  function view(h: HabitatMonster, habitat: number): ZooMonsterView {
    const napping = h.record.status === "napping";
    const waving = (h.goodbye?.waveLeft ?? 0) > 0;
    const still = napping || waving;
    return {
      id: h.record.id,
      name: h.record.name,
      image: h.record.image,
      temperament: h.record.temperament,
      mainColor: h.record.mainColor,
      eyes: h.eyes,
      drawnAt: h.record.drawnAt,
      bio: h.record.bio,
      habitat,
      x: h.x,
      y: h.y,
      width: h.width,
      height: h.height,
      // Napping Monsters sleep where they are, and Say Goodbye starts with a wave.
      vx: still ? 0 : h.dirX * h.speed,
      vy: still ? 0 : h.dirY * h.speed,
      napping,
      leaving: h.goodbye !== undefined,
      waving,
    };
  }

  function wander(dt: number) {
    for (const h of everyone()) {
      if (h.record.status === "napping") continue;
      if (h.goodbye) {
        walkAway(h, h.goodbye, dt);
        continue;
      }
      h.turnIn -= dt;
      if (h.turnIn <= 0) {
        h.turnIn += turnDelay();
        const heading = Math.atan2(h.dirY, h.dirX) + ((dice.roll() * HABITAT_MAX_TURN * Math.PI) / 180) * randomSign();
        h.dirX = Math.cos(heading);
        h.dirY = Math.sin(heading);
      }
      h.x += h.dirX * h.speed * dt;
      h.y += h.dirY * h.speed * dt;
      ({ pos: h.x, dir: h.dirX } = bounce(h.x, h.dirX, h.width / 2, arena.width - h.width / 2));
      ({ pos: h.y, dir: h.dirY } = bounce(h.y, h.dirY, h.height / 2, arena.height - h.height / 2));
    }
  }

  /** Waves, then walks straight out of the Habitat, past the wall. */
  function walkAway(h: HabitatMonster, goodbye: Goodbye, dt: number) {
    if (goodbye.waveLeft > 0) {
      goodbye.waveLeft = Math.max(0, goodbye.waveLeft - dt);
      if (goodbye.waveLeft === 0) {
        h.dirX = goodbye.dirX;
        h.dirY = 0;
        h.speed = GOODBYE_WALK_SPEED;
      }
      return;
    }
    h.x += h.dirX * h.speed * dt;
  }

  /** Whether a Monster walking away has gone right out of sight. */
  const outOfSight = (h: HabitatMonster) => h.x + h.width / 2 <= 0 || h.x - h.width / 2 >= arena.width;

  return {
    arena,
    phase: () => (inZoo ? "zoo" : round.phase()),
    async loadZoo() {
      const records = await storage.list();
      // Skip Monsters already here, and the one being caught right now.
      const here = new Set([...everyone().map((h) => h.record.id), catching?.id]);
      const arriving = records.filter((r) => !here.has(r.id) && !goneIds.has(r.id)).map(withBio);
      // Each back in the Habitat it's kept in. Then any not in one yet, oldest
      // first, filling each Habitat before starting the next, and saved there.
      const kept = arriving.filter((r) => r.habitat !== undefined);
      const unplaced = arriving.filter((r) => r.habitat === undefined);
      for (const r of [...kept, ...unplaced]) {
        const h = intoHabitat(r, { x: dice.roll() * arena.width, y: dice.roll() * arena.height });
        if (settle(h, false) !== r.habitat) save(h.record);
      }
      // A Napping Monster is waiting to be resumed: open where the kid can see it.
      const napping = habitats.findIndex((habitat) => habitat.some((h) => h.record.status === "napping"));
      if (napping >= 0) shown = napping;
    },
    zoo: () => habitats.flatMap((habitat, i) => habitat.map((h) => view(h, i))),
    habitatCount: () => habitats.length,
    shownHabitat: () => shown,
    monstersShown: () => habitats[shown].map((h) => view(h, shown)),
    showHabitat(index) {
      if (!Number.isInteger(index) || index < 0 || index >= habitats.length) return false;
      shown = index;
      return true;
    },
    zooMonsterAt(at) {
      // Nearer the bottom is drawn in front, so it's the one a tap lands on.
      const hit = habitats[shown]
        .filter((h) => !h.goodbye && onOval(at, h, h.width, h.height))
        .sort((a, b) => b.y - a.y)[0];
      return hit && view(hit, shown);
    },
    resume(id) {
      const h = find(id);
      if (!inZoo || !h || h.record.status !== "napping") return false;
      unsettle(h);
      round = createRound(dice, () => hardMode, h.record);
      drawing = undefined;
      catching = h.record;
      inZoo = false;
      return true;
    },
    sayGoodbye(id) {
      const h = find(id);
      if (!inZoo || !h || h.goodbye) return false;
      h.goodbye = { waveLeft: GOODBYE_WAVE_SECONDS, dirX: h.x < arena.width / 2 ? -1 : 1 };
      goneIds.add(id);
      store(() => storage.remove(id));
      return true;
    },
    saved: () => saving,
    startRound() {
      if (!inZoo) return false;
      round = createRound(dice, () => hardMode);
      drawing = undefined;
      catching = undefined;
      inZoo = false;
      return true;
    },
    leave() {
      if (inZoo || round.phase() !== "catch" || round.monster().caught || !catching) return false;
      const h = intoHabitat(catching, round.monster());
      shown = settle(h, true);
      // Saving as it leaves may not finish; if not, it finds a Habitat again next time.
      save(h.record);
      catching = undefined;
      inZoo = true;
      return true;
    },
    goToZoo() {
      if (inZoo || !round.monster().caught) return false;
      inZoo = true;
      return true;
    },
    enoughInk: (inkAmount) => inkAmount >= MIN_INK,
    finishDrawing(ink, image) {
      if (inZoo || !round.finishDrawing(ink)) return false;
      drawing = {
        image,
        size: { width: ink.width, height: ink.height },
        drawnAt: new Date(clock.now()).toISOString(),
      };
      return true;
    },
    eyes: () => round.eyes(),
    placeEye: (at) => round.placeEye(at),
    moveEye: (id, to) => round.moveEye(id, to),
    removeEye: (id) => round.removeEye(id),
    pickTemperament: (picked) => round.pickTemperament(picked),
    setHardMode(on) {
      hardMode = on;
    },
    hardMode: () => hardMode,
    name: () => round.name(),
    rerollName: () => round.rerollName(),
    setName: (typed) => round.setName(typed),
    canStartCatch: () => round.canStartCatch(),
    startCatch() {
      if (!round.startCatch()) return false;
      saveNapping();
      return true;
    },
    tick(dt) {
      if (inZoo) {
        wander(dt);
        habitats = habitats.map((habitat) => habitat.filter((h) => !(h.goodbye && outOfSight(h))));
        return "none";
      }
      return round.tick(dt);
    },
    monster: () => round.monster(),
    // Nothing in the Zoo can be caught (again): taps there are only for looking.
    bonk(at) {
      if (inZoo) return "miss";
      const result = round.bonk(at);
      if (result === "caught") moveIntoZoo();
      return result;
    },
    flick(path) {
      if (inZoo) return "miss";
      const result = round.flick(path);
      if (result === "caught") moveIntoZoo();
      return result;
    },
  };
}

/** Every Monster's size in arena units: its drawing's shape, scaled so its longest side is MONSTER_SIZE. */
function monsterSize(drawn: { width: number; height: number }) {
  const fit = MONSTER_SIZE / Math.max(drawn.width, drawn.height);
  return { width: drawn.width * fit, height: drawn.height * fit };
}

/** A unique id for a Monster: 128 bits from the dice, as 32 hex digits. */
function newId(dice: Dice): string {
  let id = "";
  for (let i = 0; i < 4; i++) id += Math.floor(dice.roll() * 2 ** 32).toString(16).padStart(8, "0");
  return id;
}

/** One word from a list, chosen with the dice. */
function pickWord(dice: Dice, words: readonly string[]): string {
  return words[Math.floor(dice.roll() * words.length)];
}

/** Fills a name template's {blanks} from the word lists, choosing with the dice. */
function generateName(dice: Dice): string {
  const pick = (words: readonly string[]) => pickWord(dice, words);
  return pick(NAME_WORDS.templates).replace(/\{(\w+)\}/g, (_, list: keyof typeof NAME_WORDS) => pick(NAME_WORDS[list]));
}

/**
 * Writes a Bio from real facts about the Monster: its name, how many Googly
 * Eyes it has, its main color and its Temperament. The rest of the words are
 * chosen with the dice.
 */
function generateBio(dice: Dice, m: Pick<MonsterRecord, "name" | "eyes" | "mainColor" | "temperament">): string {
  const pick = (words: readonly string[]) => pickWord(dice, words);
  const facts: Record<string, string> = {
    name: m.name,
    eyes: BIO_WORDS.eyeCounts[Math.min(m.eyes.length, BIO_WORDS.eyeCounts.length) - 1],
    color: m.mainColor,
    temperament: TEMPERAMENTS.find((t) => t.id === m.temperament)!.word.toLowerCase(),
  };
  const lists: Record<string, readonly string[]> = { ...BIO_WORDS, habit: BIO_WORDS.habit[m.temperament] };
  return pick(BIO_WORDS.templates).replace(/\{(\w+)\}/g, (_, blank: string) => facts[blank] ?? pick(lists[blank]));
}

/** Keeps a point relative to the drawing's box inside the box. */
function onDrawing(p: Point): Point {
  return { x: Math.min(1, Math.max(0, p.x)), y: Math.min(1, Math.max(0, p.y)) };
}

/**
 * Whether a tap (one point) or a swipe lands on the oval filling a Monster's
 * box, with TOUCH_SLOP of slack all round. Squashing the arena so the oval
 * becomes a unit circle turns this into a circle test.
 */
function crossesOval(path: readonly Point[], centre: Point, width: number, height: number): boolean {
  const rx = width / 2 + TOUCH_SLOP;
  const ry = height / 2 + TOUCH_SLOP;
  const squashed = path.map((p) => ({ x: (p.x - centre.x) / rx, y: (p.y - centre.y) / ry }));
  return crossesCircle(squashed, { x: 0, y: 0 }, 1);
}

/** Whether a tap lands on the oval filling a Monster's box, centred on it. */
function onOval(at: Point, centre: Point, width: number, height: number): boolean {
  return crossesOval([at], centre, width, height);
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
