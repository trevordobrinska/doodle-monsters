import { lasts, strengthAt, type Envelope } from "./envelope";
import type { Trick } from "./trick";

export interface FadeView {
  readonly trick: "fade";
  /**
   * How visible the Monster is, Googly Eyes and all: 1 is fully visible.
   * Never 0, so a kid who keeps track of it can still find it.
   */
  readonly opacity: number;
}

/** A Fade lasts about a second: fading out, staying faint, then coming back. */
const FADE_SECONDS: Envelope = { up: 0.2, hold: 0.7, down: 0.25 };
/** Almost, but not fully, invisible. */
const FAINTEST = 0.12;

/**
 * 🤫 Sneaky's Trick: now and then it goes almost invisible for about a
 * second. Bonks and Flicks work as normal meanwhile.
 */
export const FADE: Trick = {
  timing: { everySeconds: 3 },
  getsInTheWay: false,
  play() {
    let t = 0;
    return {
      view: () => ({ trick: "fade", opacity: 1 - (1 - FAINTEST) * strengthAt(FADE_SECONDS, t) }),
      over: () => t >= lasts(FADE_SECONDS),
      tick(dt) {
        t += dt;
      },
    };
  },
};
