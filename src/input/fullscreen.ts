/**
 * The bits of `document` that asking for fullscreen needs, so tests can pass a
 * fake. The `webkit` names are the older prefixed API, for browsers that only
 * have that.
 */
export interface FullscreenDocument {
  readonly fullscreenElement?: Element | null;
  webkitFullscreenElement?: Element | null;
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
