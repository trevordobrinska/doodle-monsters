import type { Trick } from "./trick";

export interface DodgeView {
  readonly trick: "dodge";
  /** How high the Monster is drawn off the ground mid-hop, in arena units: 0 when not hopping. */
  readonly lift: number;
}

/** For about this long it's ready to Dodge the next tap that would land. */
const READY_SECONDS = 1.2;
/** The hop sideways: quick, but slow enough to see. */
const HOP_SECONDS = 0.3;
/** How far it hops, as a share of its width: far enough that the finger is left behind. */
const HOP_WIDTHS = 0.9;
/** How high the hop peaks, as a share of its height. */
const HOP_HEIGHT = 0.35;

/**
 * 🦘 Bouncy's Trick: now and then, just as a finger lands on it, it hops
 * sideways out of the way, and the tap goes "boing". It never Dodges twice in
 * a row: after a Dodge the go lasts until the next tap that lands, and that
 * one works as normal. Flicks are never Dodged.
 */
export const DODGE: Trick = {
  timing: { everySeconds: 2.5 },
  getsInTheWay: true,
  play(body) {
    let phase: "ready" | "hopping" | "spent" | "over" = "ready";
    let t = 0;
    /** The whole hop, in arena units along x: the Monster moves along it while hopping. */
    let hopDx = 0;

    /** Picks the side away from the finger, or the other side if a wall is in the way. */
    function hopSideways(fingerX: number) {
      const distance = body.width * HOP_WIDTHS;
      const away = fingerX > body.x ? -1 : fingerX < body.x ? 1 : body.dice.roll() < 0.5 ? -1 : 1;
      const room = body.roomTowards(away * distance);
      hopDx = room >= distance / 2 ? away * room : -away * distance;
    }

    return {
      view: () => ({
        trick: "dodge",
        lift: phase === "hopping" ? Math.sin((Math.PI * t) / HOP_SECONDS) * body.height * HOP_HEIGHT : 0,
      }),
      over: () => phase === "over",
      tick(dt) {
        if (phase === "ready") {
          t += dt;
          if (t >= READY_SECONDS) phase = "over";
        } else if (phase === "hopping") {
          const step = Math.min(dt, HOP_SECONDS - t);
          body.shift((hopDx * step) / HOP_SECONDS, 0);
          t += step;
          if (t >= HOP_SECONDS) phase = "spent";
        }
      },
      speed: () => (phase === "hopping" ? 0 : 1),
      tap(at, onMonster) {
        if (!onMonster) return undefined;
        if (phase === "ready") {
          hopSideways(at.x);
          phase = "hopping";
          t = 0;
          return "boing";
        }
        // The tap after a Dodge always works as normal.
        phase = "over";
        return undefined;
      },
      flick() {
        phase = "over";
        return undefined;
      },
    };
  },
};
