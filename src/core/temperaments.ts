/**
 * The Temperaments a kid can pick from, each shown as a word and an icon.
 * Each one also has its own behavior during the Catch.
 */
export const TEMPERAMENTS = [
  // Shy was called Sturdy at first. Kids only see the new word; the stored
  // value stays "sturdy" so Monsters already saved keep loading unchanged.
  { id: "speedy", word: "Speedy", icon: "⚡" },
  { id: "sneaky", word: "Sneaky", icon: "🤫" },
  { id: "bouncy", word: "Bouncy", icon: "🦘" },
  { id: "sturdy", word: "Shy", icon: "🙈" },
  { id: "sleepy", word: "Sleepy", icon: "😴" },
] as const;

export type Temperament = (typeof TEMPERAMENTS)[number]["id"];

/**
 * How a Monster gets around between Bonks: in straight lines from wall to
 * wall, zigzagging off in new directions on its own, or in hops.
 */
export type Wander = "straight" | "zigzag" | "hop";

/** How a Temperament makes a Monster behave during its Catch. */
export interface Behavior {
  /** Normal moving speed, in pixels per second. */
  readonly speed: number;
  /** Extra speed right after a dash, as a fraction of its normal speed. */
  readonly dashBoost: number;
  /** How long a Bonk leaves it Stunned, in seconds. */
  readonly stunnedSeconds: number;
  /** Once Dizzy starts draining, it loses a step this often, in seconds. */
  readonly drainStepSeconds: number;
  readonly wander: Wander;
}

/**
 * Each Temperament's behavior in normal mode. Starting points to tune by
 * playtest: normal mode should take a 7-year-old about 30–60 s to Catch.
 * Speedy is fast with a big dash; Sneaky zigzags; Bouncy hops; Shy shakes
 * off Bonks and Dizzy quickly but moves slowly; Sleepy is the gentlest.
 */
export const BEHAVIORS: Record<Temperament, Behavior> = {
  speedy: { speed: 380, dashBoost: 1, stunnedSeconds: 1, drainStepSeconds: 1.5, wander: "straight" },
  sneaky: { speed: 320, dashBoost: 0.9, stunnedSeconds: 0.9, drainStepSeconds: 1.5, wander: "zigzag" },
  bouncy: { speed: 320, dashBoost: 0.8, stunnedSeconds: 1, drainStepSeconds: 1.5, wander: "hop" },
  sturdy: { speed: 280, dashBoost: 0.5, stunnedSeconds: 0.8, drainStepSeconds: 1.2, wander: "straight" },
  sleepy: { speed: 230, dashBoost: 0.6, stunnedSeconds: 1.3, drainStepSeconds: 2.2, wander: "straight" },
};

/**
 * Hard mode's one tightening, applied to every Temperament alike: faster,
 * bigger dashes, shorter Stunned and quicker-draining Dizzy, and Tricks
 * that start this many steps of Dizzy sooner and happen this much more
 * often. How it wanders and the Tricks themselves stay the same, so each
 * Temperament still feels like itself.
 */
const HARD_MODE = {
  speed: 1.3,
  dashBoost: 1.4,
  stunnedSeconds: 0.75,
  drainStepSeconds: 0.65,
  tricksSooner: 1,
  tricksMoreOften: 1.6,
};

export function tighten(behavior: Behavior): Behavior {
  return {
    ...behavior,
    speed: behavior.speed * HARD_MODE.speed,
    dashBoost: behavior.dashBoost * HARD_MODE.dashBoost,
    stunnedSeconds: behavior.stunnedSeconds * HARD_MODE.stunnedSeconds,
    drainStepSeconds: behavior.drainStepSeconds * HARD_MODE.drainStepSeconds,
  };
}

/**
 * How Tricks ramp up during a Catch: none until the Monster has `fromDizzy`
 * steps of Dizzy, then more and more often as it gets more Dizzy. `often`
 * scales the whole ramp.
 */
export interface TrickRamp {
  readonly fromDizzy: number;
  readonly often: number;
}

/** Hard mode's tightening of the Trick ramp: Tricks start sooner and happen more often. */
export function tightenTrickRamp(ramp: TrickRamp): TrickRamp {
  return {
    fromDizzy: ramp.fromDizzy - HARD_MODE.tricksSooner,
    often: ramp.often * HARD_MODE.tricksMoreOften,
  };
}
