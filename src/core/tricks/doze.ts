import type { Trick } from "./trick";

export interface DozeView {
  readonly trick: "doze";
}

/** If nobody wakes it, it wakes on its own after this many seconds. */
const DOZE_SECONDS = 3;

/**
 * 😴 Sleepy's Trick: it stops and dozes. The first tap or Flick that lands
 * only wakes it, with a "boing" and no Dizzy, and it dashes off. The next
 * one works as normal. The gentlest Trick: a dozing Monster is easy to find.
 */
export const DOZE: Trick = {
  everySeconds: 4,
  getsInTheWay: true,
  play(body) {
    let t = 0;
    let woken = false;
    function wake(): "boing" {
      woken = true;
      body.dashOff();
      return "boing";
    }
    return {
      view: () => ({ trick: "doze" }),
      over: () => woken || t >= DOZE_SECONDS,
      tick(dt) {
        t += dt;
      },
      speed: () => 0,
      tap: (_at, onMonster) => (onMonster ? wake() : undefined),
      flick: wake,
    };
  },
};
