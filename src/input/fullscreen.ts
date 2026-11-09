/**
 * The bits of `document` that asking for fullscreen needs, so tests can pass a
 * fake. The `webkit` names are the older prefixed API, for browsers that only
 * have that.
 */
export interface FullscreenDocument {
  readonly fullscreenElement?: Element | null;
  readonly webkitFullscreenElement?: Element | null;
  readonly documentElement: {
    requestFullscreen?(options?: FullscreenOptions): Promise<void>;
    webkitRequestFullscreen?(): void;
  };
}

/**
 * Asks the browser to make the whole page fullscreen, hiding the Kids top bar.
 * Only asks when the page isn't fullscreen already and the browser has a way
 * to. A refusal (or no API at all) is silent: the game just stays as it is.
 * Browsers only allow this during a tap, so call it from a tap's handler.
 */
export function askForFullscreen(doc: FullscreenDocument): void {
  if (doc.fullscreenElement || doc.webkitFullscreenElement) return;
  const root = doc.documentElement;
  try {
    if (root.requestFullscreen) {
      root.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    } else if (root.webkitRequestFullscreen) {
      root.webkitRequestFullscreen();
    }
  } catch {
    // Refused straight away (some browsers throw instead of rejecting): stay as we are.
  }
}

/** The bit of the app root that listening for taps needs, so tests can pass a fake. */
export interface TapTarget {
  addEventListener(type: "pointerup", listener: () => void, options: AddEventListenerOptions): void;
}

/**
 * Asks for fullscreen on every tap, for the life of the page, so it's asked
 * again after Back or a page change ends it (ADR 0002).
 *
 * On a finger lifting, not touching down: browsers only count a touch as a
 * user action (which fullscreen needs) when the finger lifts. A mouse button
 * counts on press, and a lift straight after it still counts. Capture phase and
 * passive, never stopped or prevented, so the same tap still presses its
 * button, Bonks or draws.
 */
export function askForFullscreenOnTaps(root: TapTarget, doc: FullscreenDocument): void {
  root.addEventListener("pointerup", () => askForFullscreen(doc), { capture: true, passive: true });
}
