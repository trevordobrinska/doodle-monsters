import { describe, expect, it } from "vitest";
import { askForFullscreen, askForFullscreenOnTaps, type FullscreenDocument } from "./fullscreen";

/** A fake document that records each fullscreen request made on its root element. */
function fakeDocument(
  options: {
    fullscreenElement?: Element | null;
    webkitFullscreenElement?: Element | null;
    requestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
    webkitRequestFullscreen?: () => void;
  } = {},
) {
  const requests: string[] = [];
  const { requestFullscreen, webkitRequestFullscreen } = options;
  const doc: FullscreenDocument = {
    fullscreenElement: options.fullscreenElement ?? null,
    ...("webkitFullscreenElement" in options && {
      webkitFullscreenElement: options.webkitFullscreenElement ?? null,
    }),
    documentElement: {
      ...(requestFullscreen && {
        requestFullscreen: (opts?: FullscreenOptions) => {
          requests.push(`standard ${JSON.stringify(opts)}`);
          return requestFullscreen(opts);
        },
      }),
      ...(webkitRequestFullscreen && {
        webkitRequestFullscreen: () => {
          requests.push("webkit");
          webkitRequestFullscreen();
        },
      }),
    },
  };
  return { doc, requests };
}

const granted = () => Promise.resolve();

describe("asking for fullscreen", () => {
  it("asks for fullscreen with the navigation UI hidden when the page isn't fullscreen", () => {
    const { doc, requests } = fakeDocument({ requestFullscreen: granted });

    askForFullscreen(doc);

    expect(requests).toEqual(['standard {"navigationUI":"hide"}']);
  });

  it("doesn't ask when the page is already fullscreen", () => {
    const { doc, requests } = fakeDocument({ fullscreenElement: {} as Element, requestFullscreen: granted });

    askForFullscreen(doc);

    expect(requests).toEqual([]);
  });

  it("uses the webkit request when that's the only one there is", () => {
    const { doc, requests } = fakeDocument({ webkitFullscreenElement: null, webkitRequestFullscreen: () => {} });

    askForFullscreen(doc);

    expect(requests).toEqual(["webkit"]);
  });

  it("doesn't ask when a webkit-only page is already fullscreen", () => {
    const { doc, requests } = fakeDocument({ webkitFullscreenElement: {} as Element, webkitRequestFullscreen: () => {} });

    askForFullscreen(doc);

    expect(requests).toEqual([]);
  });

  it("does nothing when the browser has no fullscreen API", () => {
    const { doc, requests } = fakeDocument();

    expect(() => askForFullscreen(doc)).not.toThrow();
    expect(requests).toEqual([]);
  });

  // Vitest fails the run on an unhandled rejection, so letting the refusal
  // settle is enough to catch one that isn't swallowed.
  it("swallows a refused request without an unhandled rejection", async () => {
    const { doc, requests } = fakeDocument({
      requestFullscreen: () => Promise.reject(new TypeError("Permissions check failed")),
    });

    expect(() => askForFullscreen(doc)).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(requests).toHaveLength(1);
  });

  it("swallows a request that throws straight away", () => {
    const { doc } = fakeDocument({
      requestFullscreen: () => {
        throw new Error("Not allowed");
      },
    });

    expect(() => askForFullscreen(doc)).not.toThrow();
  });
});

describe("askForFullscreenOnTaps", () => {
  /** A fake app root that keeps its listeners so a test can fire them. */
  function fakeRoot() {
    const listeners: { type: string; options: unknown; fire: () => void }[] = [];
    return {
      listeners,
      addEventListener(type: string, listener: () => void, options?: unknown) {
        listeners.push({ type, options, fire: listener });
      },
    };
  }

  // A finger touching down isn't a user action that lets a page go
  // fullscreen; only lifting it is. Asking on touch-down was refused on the
  // tablet, so the Draw tap didn't go fullscreen and the first drawn line did.
  it("asks when a finger lifts, not when it touches down", () => {
    const root = fakeRoot();
    askForFullscreenOnTaps(root, fakeDocument({ requestFullscreen: granted }).doc);
    expect(root.listeners.map((l) => l.type)).toEqual(["pointerup"]);
  });

  it("listens in the capture phase and passively, so the tap still does its job", () => {
    const root = fakeRoot();
    askForFullscreenOnTaps(root, fakeDocument({ requestFullscreen: granted }).doc);
    expect(root.listeners[0]!.options).toEqual({ capture: true, passive: true });
  });

  it("asks for fullscreen on every lift", () => {
    const root = fakeRoot();
    const { doc, requests } = fakeDocument({ requestFullscreen: granted });
    askForFullscreenOnTaps(root, doc);
    root.listeners[0]!.fire();
    root.listeners[0]!.fire();
    expect(requests).toHaveLength(2);
  });
});
