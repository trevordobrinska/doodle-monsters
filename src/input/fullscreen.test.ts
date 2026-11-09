import { describe, expect, it } from "vitest";
import { askForFullscreen, type FullscreenDocument } from "./fullscreen";

/** A fake document that records each fullscreen request made on its root element. */
function fakeDocument(
  options: {
    fullscreenElement?: unknown;
    webkitFullscreenElement?: unknown;
    requestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
    webkitRequestFullscreen?: () => void;
  } = {},
) {
  const requests: string[] = [];
  const documentElement: FullscreenDocument["documentElement"] = {};
  if (options.requestFullscreen) {
    const request = options.requestFullscreen;
    documentElement.requestFullscreen = (opts?: FullscreenOptions) => {
      requests.push(`standard ${JSON.stringify(opts)}`);
      return request(opts);
    };
  }
  if (options.webkitRequestFullscreen) {
    const request = options.webkitRequestFullscreen;
    documentElement.webkitRequestFullscreen = () => {
      requests.push("webkit");
      request();
    };
  }
  const doc: FullscreenDocument = {
    fullscreenElement: (options.fullscreenElement ?? null) as Element | null,
    documentElement,
  };
  if ("webkitFullscreenElement" in options) {
    doc.webkitFullscreenElement = (options.webkitFullscreenElement ?? null) as Element | null;
  }
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
    const { doc, requests } = fakeDocument({ fullscreenElement: {}, requestFullscreen: granted });

    askForFullscreen(doc);

    expect(requests).toEqual([]);
  });

  it("uses the webkit request when that's the only one there is", () => {
    const { doc, requests } = fakeDocument({ webkitFullscreenElement: null, webkitRequestFullscreen: () => {} });

    askForFullscreen(doc);

    expect(requests).toEqual(["webkit"]);
  });

  it("doesn't ask when a webkit-only page is already fullscreen", () => {
    const { doc, requests } = fakeDocument({ webkitFullscreenElement: {}, webkitRequestFullscreen: () => {} });

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
