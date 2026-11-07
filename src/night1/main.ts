// Night 1 test page: a throwaway page that checks, on a Fire HD 8 in an Amazon
// Kids profile, everything the Night 1 checklist in DESIGN.md asks. Not part of
// the game; remove this folder (and night1/, public/night1/) after Night 1.

type Status = "pass" | "fail" | "pending" | "info";

interface Card {
  /** Where a check puts its buttons, inputs and extra output. */
  body: HTMLElement;
  /** The automatic result. A human verdict (if given) wins for the badge. */
  set(status: Status, label: string, detail?: string): void;
  /** Adds "did it work?" buttons for things the page can't detect itself. */
  ask(question: string, yesLabel: string, noLabel: string): void;
}

const VERDICT_KEY = "night1:verdict:";
const grid = document.querySelector<HTMLElement>("#checks")!;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function card(id: string, title: string, wide = false): Card {
  const badge = el("span", { className: "badge", textContent: "…" });
  const detail = el("p", { className: "detail" });
  const body = el("div");
  grid.append(
    el(
      "section",
      { className: wide ? "wide" : "" },
      el("div", { className: "head" }, el("h2", { textContent: title }), badge),
      detail,
      body,
    ),
  );

  let auto: { status: Status; label: string } = { status: "pending", label: "Checking…" };
  const render = () => {
    const verdict = localStorage.getItem(VERDICT_KEY + id);
    const shown =
      verdict === "pass" || verdict === "fail"
        ? { status: verdict, label: verdict === "pass" ? "PASS (you said)" : "FAIL (you said)" }
        : auto;
    badge.className = `badge ${shown.status}`;
    badge.textContent = shown.label;
  };
  render();

  return {
    body,
    set(status, label, text) {
      auto = { status, label };
      if (text !== undefined) detail.textContent = text;
      render();
    },
    ask(question, yesLabel, noLabel) {
      const choose = (v: "pass" | "fail") => () => {
        localStorage.setItem(VERDICT_KEY + id, v);
        render();
      };
      body.append(
        el(
          "div",
          { className: "row" },
          el("span", { textContent: question }),
          el("button", { className: "yes", textContent: yesLabel, onclick: choose("pass") }),
          el("button", { className: "no", textContent: noLabel, onclick: choose("fail") }),
          el("button", {
            textContent: "Forget my answer",
            onclick: () => {
              localStorage.removeItem(VERDICT_KEY + id);
              render();
            },
          }),
        ),
      );
    },
  };
}

function errorText(e: unknown): string {
  return e instanceof Error ? `${e.name}: ${e.message}` : String(e);
}

function formatTime(ms: number): string {
  const ago = Date.now() - ms;
  const mins = Math.round(ago / 60000);
  const agoText =
    mins < 1 ? "just now" : mins < 120 ? `${mins} min ago` : `${(mins / 60).toFixed(1)} hours ago`;
  return `${new Date(ms).toLocaleString()} (${agoText})`;
}

function randomId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// ---------- IndexedDB (tiny key-value wrapper) ----------

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("night1-test", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("IndexedDB open was blocked"));
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction("kv").objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

interface VisitRecord {
  firstVisit: number;
  lastSaved: number;
  visits: number;
}

// ---------- Checks ----------

function pageLoads() {
  const c = card("loads", "1. Page loads");
  c.set(
    "pass",
    "PASS",
    `The page and its script ran.\nScreen ${screen.width}×${screen.height}, window ${innerWidth}×${innerHeight}, ` +
      `pixel ratio ${devicePixelRatio}\n${navigator.userAgent}`,
  );
}

async function storage(): Promise<string | undefined> {
  const c = card("storage", "2. Saved data survives (IndexedDB)");
  c.body.append(
    el("p", {
      className: "detail",
      textContent:
        "Each visit writes a timestamp. Close the app, reboot, and come back in a few days: " +
        "the earlier visit should still be listed.",
    }),
  );
  try {
    const db = await openDb();
    let profileId = await idbGet<string>(db, "profileId");
    if (!profileId) {
      profileId = randomId();
      await idbPut(db, "profileId", profileId);
    }
    const before = await idbGet<VisitRecord>(db, "visits");
    const now = Date.now();
    const after: VisitRecord = {
      firstVisit: before?.firstVisit ?? now,
      lastSaved: now,
      visits: (before?.visits ?? 0) + 1,
    };
    await idbPut(db, "visits", after);
    const readBack = await idbGet<VisitRecord>(db, "visits");
    if (readBack?.lastSaved !== now) throw new Error("Wrote a record but couldn't read it back");

    // A localStorage mirror, to compare in case one is wiped and not the other.
    const lsPrev = localStorage.getItem("night1:lastSaved");
    localStorage.setItem("night1:lastSaved", String(now));

    const lines = [
      before
        ? `Last saved (previous visit): ${formatTime(before.lastSaved)}`
        : "Last saved: nothing yet (this is the first visit in this profile)",
      `First visit: ${formatTime(after.firstVisit)}`,
      `Visits so far: ${after.visits}`,
      `localStorage copy of last save: ${lsPrev ? formatTime(Number(lsPrev)) : "none"}`,
    ];
    if (before) c.set("pass", `PASS · remembered ${before.visits} earlier visit(s)`, lines.join("\n"));
    else c.set("pending", "Saved · come back later", lines.join("\n"));
    console.info("[night1] storage", { before, after });
    return profileId;
  } catch (e) {
    c.set("fail", "FAIL", `IndexedDB didn't work: ${errorText(e)}`);
    return undefined;
  }
}

async function persistence() {
  const c = card("persist", "3. Persistent storage");
  const s = navigator.storage;
  if (!s?.persisted || !s.persist) {
    c.set("fail", "Not supported", "navigator.storage.persist isn't available in this browser.");
    return;
  }

  const show = async (requested: boolean, grantedNow?: boolean) => {
    const persisted = grantedNow ?? (await s.persisted());
    let est = "Storage estimate: not available";
    if (s.estimate) {
      const { usage = 0, quota = 0 } = await s.estimate();
      est = `Storage estimate: using ${(usage / 1024).toFixed(1)} KB of ${(quota / 1024 / 1024).toFixed(0)} MB`;
    }
    const text = `Requested: ${requested ? "yes" : "no"}\nGranted: ${persisted ? "yes" : "no"}\n${est}`;
    if (persisted) c.set("pass", "PASS · granted", text);
    else c.set(requested ? "fail" : "pending", requested ? "Not granted" : "Not requested", text);
  };

  const request = async () => {
    try {
      const granted = await s.persist();
      console.info("[night1] persist() →", granted);
      await show(true, granted);
    } catch (e) {
      c.set("fail", "FAIL", `persist() threw: ${errorText(e)}`);
    }
  };

  c.body.append(
    el(
      "div",
      { className: "row" },
      el("button", { textContent: "Ask for persistent storage again", onclick: request }),
    ),
  );
  // Ask once on load, as the real game will.
  await request();
}

function profileMarker(profileIdReady: Promise<string | undefined>) {
  const c = card("profiles", "4. Separate storage per kid profile");
  const lsId = localStorage.getItem("night1:profileId") ?? randomId();
  localStorage.setItem("night1:profileId", lsId);
  const marker = el("span", { textContent: "…" });
  marker.style.cssText = "font-size:40px;font-weight:800;letter-spacing:4px";
  c.body.prepend(el("p", { className: "detail" }, marker));
  void profileIdReady.then((id) => (marker.textContent = id ?? "— (IndexedDB failed)"));
  c.set(
    "pending",
    "Compare profiles",
    `This profile's marker (IndexedDB) is shown big below. localStorage marker: ${lsId}.\n` +
      "Open this page in the other kid's profile: the markers should be different.",
  );
  c.ask("Different marker in the other profile?", "Yes, different", "No, the same");
}

function backup(profileIdReady: Promise<string | undefined>) {
  let profileId: string | undefined;
  void profileIdReady.then((id) => (profileId = id));
  const c = card("backup", "5. Backup: download a file");
  c.set("pending", "Not tried", "Tap the button, then look for the file in Downloads (Files app).");
  const makeFile = () =>
    new File(
      [
        JSON.stringify(
          { kind: "doodle-monsters-night1-backup", profileId, savedAt: new Date().toISOString() },
          null,
          2,
        ),
      ],
      `night1-backup-${profileId ?? "unknown"}.json`,
      { type: "application/json" },
    );

  const download = () => {
    try {
      const file = makeFile();
      const url = URL.createObjectURL(file);
      const a = el("a", { href: url, download: file.name });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      c.set(
        "pending",
        "Started · did it land?",
        `Asked the browser to save "${file.name}". The page can't see whether it was saved ` +
          "or blocked: check Downloads, then answer below.",
      );
    } catch (e) {
      c.set("fail", "FAIL", `Download threw: ${errorText(e)}`);
    }
  };

  const row = el(
    "div",
    { className: "row" },
    el("button", { textContent: "Download a backup file", onclick: download }),
  );
  // A fallback route for later, in case downloads are blocked: the share sheet.
  const probe = makeFile();
  if (navigator.canShare?.({ files: [probe] })) {
    row.append(
      el("button", {
        textContent: "Share the file instead",
        onclick: async () => {
          try {
            await navigator.share({ files: [makeFile()], title: "Night 1 backup" });
            c.set("pass", "PASS · shared", "The share sheet accepted the file.");
          } catch (e) {
            c.set("fail", "Share failed", errorText(e));
          }
        },
      }),
    );
  } else {
    row.append(el("span", { textContent: "(Sharing files isn't supported here.)" }));
  }
  c.body.append(row);
  c.ask("Is the file in Downloads?", "Yes", "No / blocked");
}

function restore() {
  const c = card("restore", "6. Restore: pick a file");
  c.set("pending", "Not tried", "Pick any file (ideally the backup from check 5). Its contents appear below.");
  const out = el("pre", { hidden: true });
  const input = el("input", { type: "file" });
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) {
      c.set("pending", "Nothing picked", "The picker opened but no file came back.");
      return;
    }
    try {
      const text = await file.text();
      let note = "";
      try {
        const data = JSON.parse(text);
        if (data?.kind === "doodle-monsters-night1-backup")
          note = `\nThis is a Night 1 backup from profile ${data.profileId}, saved ${data.savedAt}.`;
      } catch {
        /* not JSON; that's fine */
      }
      c.set("pass", "PASS · read the file", `Read "${file.name}" (${file.size} bytes).${note}`);
      out.hidden = false;
      out.textContent = text.length > 2000 ? `${text.slice(0, 2000)}\n… (cut off)` : text;
    } catch (e) {
      c.set("fail", "FAIL", `Couldn't read "${file.name}": ${errorText(e)}`);
    }
  };
  c.body.append(el("div", { className: "row" }, input), out);
}

function outbound() {
  const c = card("outbound", "7. Calling an outside server (for V1.5)");
  c.set("pending", "Not tried", "Fetches a public HTTPS address that allows browser calls (CORS).");
  const url = el("input", { type: "url", value: "https://api.github.com/zen" });

  const run = async () => {
    c.set("pending", "Calling…");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    const started = performance.now();
    try {
      const res = await fetch(url.value, { signal: ctrl.signal, cache: "no-store" });
      const body = (await res.text()).slice(0, 200);
      const ms = Math.round(performance.now() - started);
      c.set(
        res.ok ? "pass" : "fail",
        res.ok ? `PASS · ${res.status}` : `FAIL · ${res.status}`,
        `${url.value} answered ${res.status} in ${ms} ms:\n${body}`,
      );
    } catch (e) {
      // Tell "no network at all" apart from "reached it, but CORS blocked reading".
      let reach = "";
      try {
        await fetch(url.value, { mode: "no-cors", cache: "no-store" });
        reach = "\nA no-cors request did get through, so the server is reachable; it may just not allow CORS.";
      } catch {
        reach = "\nA no-cors request failed too, so the address looks blocked or offline.";
      }
      c.set("fail", "FAIL", `${errorText(e)}${reach}`);
    } finally {
      clearTimeout(timer);
    }
  };

  c.body.append(el("div", { className: "row" }, url, el("button", { textContent: "Call it", onclick: run })));
}

function drawingPad() {
  const c = card("drawing", "8. Finger drawing is smooth", true);
  c.set("pending", "Judge by eye", "Draw with a finger. Lines should follow without lag or gaps.");
  const pad = el("canvas", { id: "pad" });
  const stats = el("p", { className: "detail" });
  c.body.append(
    el("div", { className: "row" }, el("button", { textContent: "Clear", onclick: () => clear() })),
    pad,
    stats,
  );
  c.ask("Does drawing feel smooth?", "Smooth", "Laggy / jumpy");

  const ctx = pad.getContext("2d")!;
  const dpr = devicePixelRatio || 1;
  const fit = () => {
    pad.width = Math.round(pad.clientWidth * dpr);
    pad.height = Math.round(pad.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#7c3aed";
  };
  const clear = () => ctx.clearRect(0, 0, pad.width, pad.height);
  fit();
  addEventListener("resize", fit);

  let last: { x: number; y: number } | undefined;
  let events = 0;
  let pointerType = "—";
  const point = (e: PointerEvent) => {
    const r = pad.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  // Midpoint quadratic curves: each sample bends the line instead of a hard corner.
  let mid: { x: number; y: number } | undefined;
  const lineTo = (p: { x: number; y: number }) => {
    if (!last) return;
    const m = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(mid?.x ?? last.x, mid?.y ?? last.y);
    ctx.quadraticCurveTo(last.x, last.y, m.x, m.y);
    ctx.stroke();
    mid = m;
    last = p;
  };

  pad.addEventListener("pointerdown", (e) => {
    pad.setPointerCapture(e.pointerId);
    pointerType = e.pointerType;
    last = point(e);
    mid = undefined;
    ctx.beginPath();
    ctx.arc(last.x, last.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  });
  pad.addEventListener("pointermove", (e) => {
    if (!last) return;
    const samples = e.getCoalescedEvents?.() ?? [e];
    for (const s of samples.length ? samples : [e]) {
      lineTo(point(s));
      events++;
    }
  });
  const end = () => (last = undefined);
  pad.addEventListener("pointerup", end);
  pad.addEventListener("pointercancel", end);

  // Frame rate and touch samples per second, to back up the eye test.
  let frames = 0;
  let windowStart = performance.now();
  const loop = (now: number) => {
    frames++;
    if (now - windowStart >= 1000) {
      const secs = (now - windowStart) / 1000;
      stats.textContent =
        `Frame rate: ${Math.round(frames / secs)} fps · touch samples: ${Math.round(events / secs)}/s ` +
        `· pointer type: ${pointerType} · coalesced events: ${"getCoalescedEvents" in PointerEvent.prototype ? "yes" : "no"}`;
      frames = 0;
      events = 0;
      windowStart = now;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function installAndFullscreen() {
  const c = card("install", "9. Home screen icon opens fullscreen");
  const modes = ["fullscreen", "standalone", "minimal-ui", "browser"] as const;
  const swState = el("p", { className: "detail" });
  const row = el("div", { className: "row" });
  c.body.append(swState, row);

  const update = () => {
    const mode = modes.find((m) => matchMedia(`(display-mode: ${m})`).matches) ?? "unknown";
    const standalone = mode === "fullscreen" || mode === "standalone";
    const text =
      `Display mode: ${mode} → ${standalone ? "running standalone (from the home screen icon)" : "running in a browser tab"}\n` +
      `Window ${innerWidth}×${innerHeight} vs screen ${screen.width}×${screen.height}`;
    if (standalone) c.set("pass", `PASS · ${mode}`, text);
    else
      c.set(
        "pending",
        "In a browser tab",
        `${text}\nAdd this page to the home screen (browser menu → Add to Home screen), then open it from the icon.`,
      );
  };
  update();
  for (const m of modes) matchMedia(`(display-mode: ${m})`).addEventListener?.("change", update);
  addEventListener("resize", update);

  // Some browsers offer their own install prompt; show a button if this one does.
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    const prompt = e as Event & { prompt(): Promise<void> };
    row.append(el("button", { textContent: "Install (browser prompt)", onclick: () => prompt.prompt() }));
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      // Resolve next to the manifest, so a URL missing its trailing slash still works.
      .register(new URL("sw.js", document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href))
      .then((reg) => (swState.textContent = `Service worker: registered (scope ${reg.scope})`))
      .catch((e) => (swState.textContent = `Service worker: failed to register: ${errorText(e)}`));
  } else {
    swState.textContent = "Service worker: not supported";
  }
  c.ask("Opened from the icon, fullscreen?", "Yes", "No");
}

function remoteDebugging() {
  const c = card("debug", "10. Remote debugging (adb + chrome://inspect)", true);
  c.set("pending", "Try it", "");
  c.body.innerHTML = `
    <ol>
      <li>On the tablet (parent profile): <b>Settings → Device Options → About Fire Tablet</b>,
        tap <b>Serial Number</b> 7 times. Then <b>Settings → Device Options → Developer Options</b>,
        turn on <b>Enable ADB</b> (USB debugging).</li>
      <li>On the PC, install Android platform-tools
        (<code>winget install Google.PlatformTools</code>, or download from developer.android.com).</li>
      <li>Plug the tablet in by USB and accept the <b>Allow USB debugging?</b> prompt.
        If the Kids profile hides the prompt, accept it from the parent profile first, then switch back.</li>
      <li>Run <code>adb devices</code>: the tablet should be listed as <code>device</code> (not <code>unauthorized</code>).</li>
      <li>In Chrome or Edge on the PC, open <code>chrome://inspect/#devices</code> (Edge: <code>edge://inspect</code>),
        tick <b>Discover USB devices</b>, find this page under the tablet and click <b>inspect</b>.</li>
      <li>Tap the button below: the message should appear in the PC's DevTools console.</li>
    </ol>`;
  let n = 0;
  c.body.append(
    el(
      "div",
      { className: "row" },
      el("button", {
        textContent: "Say hello to the PC console",
        onclick: () => console.log(`[night1] Hello from the tablet! (#${++n}, ${new Date().toLocaleTimeString()})`),
      }),
    ),
  );
  c.ask("Did the hello show up on the PC?", "Yes", "No");
}

function main() {
  // Every card is built straight away; slow async checks fill theirs in later,
  // so a hung IndexedDB can't stop the rest of the page appearing.
  pageLoads();
  const profileIdReady = storage();
  void persistence();
  profileMarker(profileIdReady);
  backup(profileIdReady);
  restore();
  outbound();
  drawingPad();
  installAndFullscreen();
  remoteDebugging();
  console.info("[night1] page ready");
}

try {
  main();
} catch (e) {
  grid.append(el("pre", { textContent: `Something broke: ${errorText(e)}` }));
  console.error(e);
}
