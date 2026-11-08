import type { Trick } from "./trick";

export interface DozeView {
  readonly trick: "doze";
}

/** If nobody wakes it, it wakes on its own after this many seconds. */
const DOZE_SECONDS = 3;

/**
 * 😴 Sleepy's Trick: it stops and dozes. The first tap or Flick that lands
 * only wakes it, with a "boing" and no Dizzy, and it dashes off. The next
 * one works as normal: once woken, the go lasts until the next tap or Flick
 * that lands, so it can't Doze again first. The gentlest Trick: a dozing
 * Monster is easy to find.
 */
export const DOZE: Trick = {
  everySeconds: 4,
  getsInTheWay: true,
  play(body) {
    let phase: "dozing" | "woken" | "over" = "dozing";
    let t = 0;
    function hit(): "boing" | undefined {
      if (phase !== "dozing") {
        // The hit after waking it always works as normal.
        phase = "over";
        return undefined;
      }
      phase = "woken";
      body.dashOff();
      return "boing";
    }
    return {
      // Once woken it runs about as normal: there's nothing to draw.
      view: () => (phase === "dozing" ? { trick: "doze" } : undefined),
      over: () => phase === "over",
      tick(dt) {
        if (phase !== "dozing") return;
        t += dt;
        // Waking on its own uses up no tap, so there's no tap to wait for.
        if (t >= DOZE_SECONDS) phase = "over";
      },
      speed: () => (phase === "dozing" ? 0 : 1),
      tap: (_at, onMonster) => (onMonster ? hit() : undefined),
      flick: hit,
    };
  },
};
