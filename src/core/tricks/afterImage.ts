import { onOval, type Oval } from "../oval";
import { lasts, strengthAt, type Envelope } from "./envelope";
import type { Trick } from "./trick";

export interface AfterImageView {
  readonly trick: "afterImage";
  /** Where the fake copy stands, in arena coordinates. It's the Monster's size, Googly Eyes and all. */
  readonly x: number;
  readonly y: number;
  /** How visible the fake is: 1 while it stands still, down to 0 as it fades away. */
  readonly opacity: number;
}

/** The fake appears at once, stands still for about a second, then fades away. */
const FAKE_SECONDS: Envelope = { up: 0, hold: 0.8, down: 0.3 };

/**
 * ⚡ Speedy's Trick: on some of its dashes after a Bonk, it leaves a fake
 * copy of itself behind where it was. A tap on the fake goes "boing" and
 * pops it; a tap on the real Monster works as normal, even where the two
 * overlap. Only one fake at a time: it's not played while a fake is about.
 */
export const AFTER_IMAGE: Trick = {
  timing: { shareOfDashes: 0.4 },
  getsInTheWay: true,
  play(body) {
    // Played just as the Monster dashes off: the fake stands right where it is.
    const fake: Oval = { x: body.x, y: body.y, width: body.width, height: body.height };
    let t = 0;
    let popped = false;

    return {
      view: () => ({ trick: "afterImage", x: fake.x, y: fake.y, opacity: strengthAt(FAKE_SECONDS, t) }),
      over: () => popped || t >= lasts(FAKE_SECONDS),
      tick(dt) {
        t += dt;
      },
      tap(at, onMonster) {
        if (onMonster || !onOval(at, fake)) return undefined;
        popped = true;
        return "boing";
      },
    };
  },
};
