import type { Dice } from "../deps";
import type { FlickResult, Point, TapResult } from "../gameCore";
import type { Oval } from "../oval";
import type { AfterImageView } from "./afterImage";
import type { DodgeView } from "./dodge";
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
  | DozeView
  | DodgeView
  | AfterImageView;

/**
 * What a Trick makes of a tap or Flick: "boing" if it fooled it, turning it
 * into a harmless boing (no Dizzy, no penalty), or undefined to let it work
 * as normal.
 */
export type Fooled = Extract<TapResult | FlickResult, "boing"> | undefined;

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
  /** How far it could move by `dx` along x before a wall stops it: from 0 up to the size of `dx`. */
  roomTowards(dx: number): number;
}

/** One go at a Trick, from when the Monster starts playing it until it's over. */
export interface TrickPlay {
  /** What the renderer is told while it plays, or undefined while there's nothing to show yet. */
  view(): TrickView | undefined;
  /** Whether it's over. Asked after every tick, tap and Flick. */
  over(): boolean;
  /** Time passes, in seconds. It keeps playing while the Monster is Stunned or flung. */
  tick(dt: number): void;
  /** How fast the Monster moves meanwhile, as a share of its usual speed: 0 stands still. Default 1. */
  speed?(): number;
  /**
   * Where taps and Flicks can hit the Monster meanwhile, given its usual
   * oval. Match what's drawn: what you see is what you can hit. Default: the usual oval.
   */
  hitArea?(usual: Oval): Oval;
  /**
   * A tap at `at` (arena coordinates). `onMonster` says whether it landed on
   * the Monster itself.
   */
  tap?(at: Point, onMonster: boolean): Fooled;
  /** A Flick that crossed the Monster. */
  flick?(): Fooled;
}

/**
 * When a Trick is played. Either every so often: about this many seconds
 * from the end of one go to the start of the next. Or on some of the dashes
 * the Monster makes after being Stunned: about this share of them. Both are
 * for a Monster nearly fully Dizzy: it's played less often while less Dizzy,
 * and more often in hard mode.
 */
export type TrickTiming = { readonly everySeconds: number } | { readonly shareOfDashes: number };

/** A Temperament's signature Trick. */
export interface Trick {
  readonly timing: TrickTiming;
  /**
   * Whether it can fool a tap or a Flick. A Trick that can never starts once
   * the Monster is fully Dizzy, and stops if it becomes fully Dizzy, so the
   * final catching tap always works.
   */
  readonly getsInTheWay: boolean;
  /**
   * Starts a go at the Trick. Only ever called while the Monster runs free
   * (not Stunned, flung or sleepy), or, for a Trick played on dashes, just
   * as it dashes off, before it has moved.
   */
  play(body: TrickBody): TrickPlay;
}
