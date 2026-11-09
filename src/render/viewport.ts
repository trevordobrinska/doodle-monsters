import type { Size } from "../core/screenFit";

/**
 * The DOM side of the screen fit: the viewport's size in CSS pixels (the
 * window, never turned), which is what `fitScreen` is given.
 */
export function viewportSize(): Size {
  const { clientWidth, clientHeight } = document.documentElement;
  return { width: clientWidth, height: clientHeight };
}
