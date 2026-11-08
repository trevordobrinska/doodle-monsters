import type { Dice } from "../deps";
import type { Point } from "../gameCore";
import type { DozeView } from "./doze";
import type { FadeView } from "./fade";
import type { ShellView } from "./shell";

/**
 * What the renderer is told about the Trick a Monster is playing, so it can
 * draw it. Each Trick adds its own view here, told apart by `trick`.
 */
export type TrickView =
  | FadeView
  | ShellView
  | DozeView;

/**
 * What a Trick can see of, and do to, the Monster playing it. It has no way
 * to touch Dizzy: a Trick can fool a kid, but never undoes their Dizzy.
 */
export interface TrickBody {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly dice: Dice;
  /** Runs off in a random direction, as it does after being Stunned. */
  dashOff(): void;
  /** Jumps by this much, staying inside the arena. */
  shift(dx: number, dy: number): void;
}

/** One go at a Trick, from when the Monster starts playing it until it's over. */
export interface TrickPlay {
  /** What the renderer is told while it plays. */
  view(): TrickView;
  /** Whether it's over. Asked after every tick, tap and Flick. */
  over(): boolean;
  /** Time passes, in seconds. It keeps playing while the Monster is Stunned or flung. */
  tick(dt: number): void;
  /** How fast the Monster moves meanwhile, as a share of its usual speed: 0 stands still. Default 1. */
  speed?(): number;
  /**
   * A tap at `at` (arena coordinates). `onMonster` says whether it landed on
   * the Monster itself. Return "boing" to turn the tap into a harmless boing
   * (no Dizzy, no penalty), or undefined to let it work as normal.
   */
  tap?(at: Point, onMonster: boolean): "boing" | undefined;
  /** A Flick that crossed the Monster. Return "boing" to shrug it off, or undefined to let it work as normal. */
  flick?(): "boing" | undefined;
  /** The Monster just dashed off after being Stunned. */
  dashedOff?(): void;
}

/** A Temperament's signature Trick. */
export interface Trick {
  /**
   * About how often it's played, in seconds from the end of one go to the
   * start of the next, when the Monster is nearly fully Dizzy. It's played
   * less often while less Dizzy, and more often in hard mode.
   */
  readonly everySeconds: number;
  /**
   * Whether it can fool a tap or a Flick. A Trick that can never starts once
   * the Monster is fully Dizzy, and stops if it becomes fully Dizzy, so the
   * final catching tap always works.
   */
  readonly getsInTheWay: boolean;
  /** Starts a go at the Trick. Only ever called while the Monster runs free: not Stunned, flung or sleepy. */
  play(body: TrickBody): TrickPlay;
}
