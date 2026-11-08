import type { Trick } from "./trick";

export interface ShellView {
  readonly trick: "shell";
  /** How far curled up it is: 0 not at all, 1 squashed small and hiding. */
  readonly curl: number;
}

/** It stays curled for about a second: curling up, staying curled, then peeking out again. */
const SHELL_SECONDS = { curling: 0.12, curled: 0.8, uncurling: 0.15 };

/**
 * 🙈 Shy's Trick: now and then it curls up for about a second. Taps on it
 * go "boing" meanwhile, but a Flick still flings it into the wall as normal,
 * and uncurls it. Outside those moments, Bonks work as normal.
 */
export const SHELL: Trick = {
  everySeconds: 3.5,
  getsInTheWay: true,
  play() {
    const total = SHELL_SECONDS.curling + SHELL_SECONDS.curled + SHELL_SECONDS.uncurling;
    let t = 0;
    function curl() {
      if (t < SHELL_SECONDS.curling) return t / SHELL_SECONDS.curling;
      if (t < SHELL_SECONDS.curling + SHELL_SECONDS.curled) return 1;
      return Math.max(0, (total - t) / SHELL_SECONDS.uncurling);
    }
    return {
      view: () => ({ trick: "shell", curl: curl() }),
      over: () => t >= total,
      tick(dt) {
        t += dt;
      },
      // Curled up, it stays put.
      speed: () => 0,
      tap: (_at, onMonster) => (onMonster ? "boing" : undefined),
      flick() {
        t = total;
        return undefined;
      },
    };
  },
};
