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
const FADE_SECONDS = { out: 0.2, faint: 0.7, back: 0.25 };
/** Almost, but not fully, invisible. */
const FAINTEST = 0.12;

/**
 * 🤫 Sneaky's Trick: now and then it goes almost invisible for about a
 * second. Bonks and Flicks work as normal meanwhile.
 */
export const FADE: Trick = {
  everySeconds: 3,
  getsInTheWay: false,
  play() {
    const total = FADE_SECONDS.out + FADE_SECONDS.faint + FADE_SECONDS.back;
    let t = 0;
    /** 0 while fully visible, up to 1 while faintest. */
    function faintness() {
      if (t < FADE_SECONDS.out) return t / FADE_SECONDS.out;
      if (t < FADE_SECONDS.out + FADE_SECONDS.faint) return 1;
      return Math.max(0, (total - t) / FADE_SECONDS.back);
    }
    return {
      view: () => ({ trick: "fade", opacity: 1 - (1 - FAINTEST) * faintness() }),
      over: () => t >= total,
      tick(dt) {
        t += dt;
      },
    };
  },
};
