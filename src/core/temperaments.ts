/**
 * The Temperaments a kid can pick from, each shown as a word and an icon.
 * Each one also has its own behavior during the Catch.
 */
export const TEMPERAMENTS = [
  { id: "speedy", word: "Speedy", icon: "⚡" },
  { id: "sneaky", word: "Sneaky", icon: "🤫" },
  { id: "bouncy", word: "Bouncy", icon: "🦘" },
  { id: "sturdy", word: "Sturdy", icon: "🪨" },
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
 * Speedy is fast with a big dash; Sneaky zigzags; Bouncy hops; Sturdy shakes
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
 * bigger dashes, shorter Stunned and quicker-draining Dizzy. How it wanders
 * stays the same, so each Temperament still feels like itself.
 */
const HARD_MODE = { speed: 1.3, dashBoost: 1.4, stunnedSeconds: 0.75, drainStepSeconds: 0.65 };

export function tighten(behavior: Behavior): Behavior {
  return {
    ...behavior,
    speed: behavior.speed * HARD_MODE.speed,
    dashBoost: behavior.dashBoost * HARD_MODE.dashBoost,
    stunnedSeconds: behavior.stunnedSeconds * HARD_MODE.stunnedSeconds,
    drainStepSeconds: behavior.drainStepSeconds * HARD_MODE.drainStepSeconds,
  };
}
