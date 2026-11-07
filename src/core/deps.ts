/** Where the core gets the time from. Injected so tests can control it. */
export interface Clock {
  /** Milliseconds since some fixed start point. */
  now(): number;
}

/** The core's only source of randomness. Injected so tests are repeatable. */
export interface Dice {
  /** A number in [0, 1). */
  roll(): number;
}

/** Dice that give the same rolls for the same seed (mulberry32). */
export function seededDice(seed: number): Dice {
  let state = seed >>> 0;
  return {
    roll() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
