/**
 * The shape of a Trick that comes and goes smoothly: ramping up, holding,
 * then ramping back down, in seconds for each part. A part can be 0 to skip it.
 */
export interface Envelope {
  readonly up: number;
  readonly hold: number;
  readonly down: number;
}

/** How long the whole envelope lasts, in seconds. */
export const lasts = (e: Envelope) => e.up + e.hold + e.down;

/** How strong it is `t` seconds in: 0 → 1 while ramping up, 1 while holding, 1 → 0 ramping down, then 0. */
export function strengthAt(e: Envelope, t: number): number {
  if (t < e.up) return t / e.up;
  if (t < e.up + e.hold) return 1;
  return Math.max(0, (lasts(e) - t) / e.down);
}
