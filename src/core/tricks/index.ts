import type { Point } from "../gameCore";
import type { Oval } from "../oval";
import { tightenTrickRamp, type Temperament, type TrickRamp } from "../temperaments";
import { AFTER_IMAGE } from "./afterImage";
import { DODGE } from "./dodge";
import { DOZE } from "./doze";
import { FADE } from "./fade";
import { SHELL } from "./shell";
import type { Fooled, Trick, TrickBody, TrickPlay, TrickView } from "./trick";

export type { Fooled, TrickBody, TrickView } from "./trick";
export type { AfterImageView } from "./afterImage";
export { curledUp } from "./shell";

/**
 * Each Temperament's signature Trick. To add a Trick: write it in its own
 * file, like `fade.ts`, add its view to `TrickView` in `trick.ts`, and list
 * it here.
 */
const TRICKS: Record<Temperament, Trick> = {
  sneaky: FADE,
  bouncy: DODGE,
  sturdy: SHELL,
  sleepy: DOZE,
  speedy: AFTER_IMAGE,
};

/**
 * How Tricks ramp up during a Catch in normal mode. None until the Monster
 * has 2 steps of Dizzy (2 Bonks, or 1 Flick), then more and more often as it
 * gets more Dizzy, most often when fully Dizzy. Hard mode tightens it, along
 * with everything else it tightens: see `tightenTrickRamp`.
 */
const RAMP: TrickRamp = { fromDizzy: 2, often: 1 };
/** The wait between goes varies by this much either way, so Tricks don't come like clockwork. */
const WAIT_SPREAD = 0.4;

/** What the Trick rules need to know about the Monster, asked fresh each time. */
export interface TrickState {
  readonly temperament: Temperament | undefined;
  readonly hardMode: boolean;
  readonly dizzy: number;
  /** Not Stunned or flung: a Trick played every so often can only start then. */
  readonly runningFree: boolean;
  readonly sleepy: boolean;
}

/**
 * Plays the Monster's Trick during its Catch: when it starts (the shared
 * ramp, hard mode and the sleepy stop), and passing the Catch's taps and Flicks
 * on to it. A Trick played on dashes starts as the Monster dashes off.
 */
export interface Tricks {
  tick(dt: number): void;
  /** A tap, before it's judged: "boing" if the Trick fooled it, undefined to judge it as normal. */
  tap(at: Point, onMonster: boolean): Fooled;
  /** A Flick that crossed the Monster, before it's judged: "boing" if the Trick shrugged it off. */
  flick(): Fooled;
  /** The Monster just dashed off after being Stunned. */
  dashedOff(): void;
  /** How fast the Monster moves, as a share of its usual speed. */
  speed(): number;
  /** Where taps and Flicks can hit the Monster, given its usual oval: what's drawn of it. */
  hitArea(usual: Oval): Oval;
  /** The Trick being played, for the renderer, or undefined if none. */
  view(): TrickView | undefined;
}

/** `fullDizzy` is how many steps of Dizzy make a Monster fully Dizzy, ready to be caught. */
export function createTricks(body: TrickBody, fullDizzy: number, state: () => TrickState): Tricks {
  let playing: TrickPlay | undefined;
  /** Until the next go, in seconds at the peak of the ramp. Rolled when first needed. */
  let waitLeft: number | undefined;

  const trick = () => {
    const { temperament } = state();
    return temperament && TRICKS[temperament];
  };
  const fullyDizzy = () => state().dizzy >= fullDizzy;

  /** 0 for no Tricks, up to 1 (more in hard mode) at the peak of the ramp. */
  function pace(): number {
    const { dizzy, hardMode } = state();
    const { fromDizzy, often } = hardMode ? tightenTrickRamp(RAMP) : RAMP;
    if (dizzy < fromDizzy) return 0;
    return (often * (dizzy - fromDizzy + 1)) / (fullDizzy - fromDizzy + 1);
  }

  /** Ends the go if it's over, or must stop: once sleepy, or fully Dizzy if it gets in the way. */
  function stopIfOver() {
    if (!playing) return;
    if (playing.over() || state().sleepy || (trick()?.getsInTheWay && fullyDizzy())) playing = undefined;
  }

  /** Whether a new go could start now: not once sleepy, nor fully Dizzy if it gets in the way. */
  const mayStart = (t: Trick) => !playing && !state().sleepy && !(t.getsInTheWay && fullyDizzy());

  /** For a Trick played every so often: counts down while it runs free, and starts a go at 0. */
  function countDown(t: Trick, everySeconds: number, dt: number) {
    if (!state().runningFree || !mayStart(t)) return;
    const p = pace();
    if (p === 0) return;
    waitLeft ??= everySeconds * (1 - WAIT_SPREAD + 2 * WAIT_SPREAD * body.dice.roll());
    waitLeft -= dt * p;
    if (waitLeft > 0) return;
    waitLeft = undefined;
    playing = t.play(body);
  }

  return {
    tick(dt) {
      const t = trick();
      if (!t) return;
      if (playing) {
        playing.tick(dt);
        stopIfOver();
      } else if ("everySeconds" in t.timing) {
        countDown(t, t.timing.everySeconds, dt);
      }
    },
    tap(at, onMonster) {
      stopIfOver();
      const result = playing?.tap?.(at, onMonster);
      stopIfOver();
      return result;
    },
    flick() {
      stopIfOver();
      const result = playing?.flick?.();
      stopIfOver();
      return result;
    },
    dashedOff() {
      // For a Trick played on dashes, the ramp sets how likely this dash is to start a go.
      const t = trick();
      if (!t || !("shareOfDashes" in t.timing) || !mayStart(t)) return;
      if (body.dice.roll() < t.timing.shareOfDashes * pace()) playing = t.play(body);
    },
    speed: () => playing?.speed?.() ?? 1,
    hitArea: (usual) => playing?.hitArea?.(usual) ?? usual,
    view: () => playing?.view(),
  };
}
