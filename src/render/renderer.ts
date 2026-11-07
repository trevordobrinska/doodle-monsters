import type { FlickResult, GameCore, MonsterView, Point, TapResult } from "../core/gameCore";

/**
 * Draws the core's state onto a canvas. Holds no game rules: everything it
 * shows comes from asking the core, plus short-lived effects (stars, squash)
 * started by the results of taps the core already judged.
 */
export interface Renderer {
  /** Matches the canvas backing store to its on-screen size. Call on resize. */
  resize(): void;
  /** Turns a pointer position (CSS pixels, viewport) into arena coordinates. */
  toArena(clientX: number, clientY: number): Point;
  /** Starts the effects for a tap the core has judged. */
  showTap(result: TapResult, at: Point): void;
  /** Starts the effects for a Flick the core has judged. */
  showFlick(result: FlickResult, path: readonly Point[]): void;
  /** Draws one frame. `dt` is seconds since the last frame, for effects. */
  draw(dt: number): void;
}

const INK = "#2b2b40";
/** Eyelids on the stand-in eyes, when sleepy. */
const LID = "#d9d4e8";
const FLOOR = "#fff8e7";
const STAR_COLORS = ["#ffd23f", "#ff8c42", "#ff5d8f", "#4cc9f0"];

/** Seconds a Bonk's squash takes to spring back. */
const SQUASH_SECONDS = 0.45;
/** Seconds the bump against the wall takes to spring back after a Flick. */
const WALL_BUMP_SECONDS = 0.5;
/** Seconds a Flick's swoosh trail lingers. */
const SWOOSH_SECONDS = 0.35;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  angle: number;
  life: number; // seconds left
  maxLife: number;
  size: number;
  color: string;
}

interface Swoosh {
  path: readonly Point[];
  life: number;
}

interface Popup {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

/** Half the Monster's width and height: from its centre to the edges of its drawing. */
const halfW = (m: MonsterView) => m.width / 2;
const halfH = (m: MonsterView) => m.height / 2;

/** Spiral eyes: fully Dizzy, and still dizzy inside the bubble. */
const hasSpiralEyes = (m: MonsterView) => m.readyToCatch || m.caught;

/**
 * `image` is the kid's drawing, trimmed to its ink. It's drawn stretched to
 * the Monster's size from the core, so what you see is what you can hit.
 */
export function createRenderer(canvas: HTMLCanvasElement, core: GameCore, image: CanvasImageSource): Renderer {
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) throw new Error("2D canvas is not supported");
  const ctx: CanvasRenderingContext2D = maybeCtx;

  // Arena units → canvas pixels. The arena is letterboxed to fit the screen.
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  // Effect state: purely visual, never fed back into the core.
  let time = 0;
  let squash = 0; // seconds left of the current Bonk squash
  let caughtFor = 0; // seconds since the bubble formed
  let wallBump = 0; // seconds left of the squash against a wall
  let wallAngle = 0; // direction from the Monster towards the wall it hit
  let wasFlying = false;
  const swooshes: Swoosh[] = [];
  const particles: Particle[] = [];
  const popups: Popup[] = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    const { width, height } = core.arena;
    scale = Math.min(canvas.width / width, canvas.height / height);
    offsetX = (canvas.width - width * scale) / 2;
    offsetY = (canvas.height - height * scale) / 2;
  }

  function toArena(clientX: number, clientY: number): Point {
    const rect = canvas.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * canvas.width;
    const py = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x: (px - offsetX) / scale, y: (py - offsetY) / scale };
  }

  function burst(at: Point, count: number, speed: number) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const v = speed * (0.6 + Math.random() * 0.6);
      const life = 0.6 + Math.random() * 0.3;
      particles.push({
        x: at.x,
        y: at.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 120,
        spin: (Math.random() - 0.5) * 10,
        angle: Math.random() * Math.PI,
        life,
        maxLife: life,
        size: 14 + Math.random() * 10,
        color: STAR_COLORS[i % STAR_COLORS.length],
      });
    }
  }

  function showTap(result: TapResult, at: Point) {
    const m = core.monster();
    switch (result) {
      case "bonk":
        squash = SQUASH_SECONDS;
        burst({ x: m.x, y: m.y - halfH(m) * 0.3 }, 8, 380);
        popups.push({ text: "BONK!", x: m.x, y: m.y - halfH(m) - 20, life: 0.7, maxLife: 0.7 });
        break;
      case "boing":
        popups.push({ text: "boing", x: at.x, y: at.y - 30, life: 0.5, maxLife: 0.5 });
        break;
      case "caught":
        caughtFor = 0;
        burst({ x: m.x, y: m.y }, 16, 520);
        popups.push({ text: "Caught!", x: m.x, y: m.y - halfH(m) * 2 - 30, life: 2.5, maxLife: 2.5 });
        break;
      case "miss":
        break;
    }
  }

  function showFlick(result: FlickResult, path: readonly Point[]) {
    // Always show the swoosh, so a kid sees their swipe registered even on a miss.
    swooshes.push({ path, life: SWOOSH_SECONDS });
    const m = core.monster();
    switch (result) {
      case "flick":
        // The flight can end within the very next tick, before draw() ever sees
        // `flying`, so note it here or the wall bump would be skipped.
        wasFlying = true;
        burst({ x: m.x, y: m.y }, 6, 300);
        popups.push({ text: "FLICK!", x: m.x, y: m.y - halfH(m) - 20, life: 0.8, maxLife: 0.8 });
        break;
      case "boing":
      case "caught":
        showTap(result, path[path.length - 1]);
        break;
      case "miss":
        break;
    }
  }

  /** Notices the moment a flung Monster lands against a wall and starts the bump. */
  function watchForWallHit(m: MonsterView) {
    if (wasFlying && !m.flying && !m.caught) {
      const { width, height } = core.arena;
      // The wall it is touching, from where it stopped.
      const gaps = [
        { gap: width - halfW(m) - m.x, angle: 0 },
        { gap: height - halfH(m) - m.y, angle: Math.PI / 2 },
        { gap: m.x - halfW(m), angle: Math.PI },
        { gap: m.y - halfH(m), angle: -Math.PI / 2 },
      ];
      wallAngle = gaps.reduce((a, b) => (b.gap < a.gap ? b : a)).angle;
      wallBump = WALL_BUMP_SECONDS;
      const wallX = m.x + Math.cos(wallAngle) * halfW(m);
      const wallY = m.y + Math.sin(wallAngle) * halfH(m);
      burst({ x: wallX, y: wallY }, 10, 420);
      popups.push({ text: "THUD!", x: m.x, y: m.y - halfH(m) - 20, life: 0.7, maxLife: 0.7 });
    }
    wasFlying = m.flying;
  }

  function update(dt: number) {
    time += dt;
    squash = Math.max(0, squash - dt);
    wallBump = Math.max(0, wallBump - dt);
    watchForWallHit(core.monster());
    for (let i = swooshes.length - 1; i >= 0; i--) {
      swooshes[i].life -= dt;
      if (swooshes[i].life <= 0) swooshes.splice(i, 1);
    }
    if (core.monster().caught) caughtFor += dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += 700 * dt; // a little gravity
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
    }
    for (let i = popups.length - 1; i >= 0; i--) {
      popups[i].life -= dt;
      popups[i].y -= 60 * dt;
      if (popups[i].life <= 0) popups.splice(i, 1);
    }
  }

  function draw(dt: number) {
    update(dt);
    const { width, height } = core.arena;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    ctx.fillStyle = FLOOR;
    ctx.fillRect(0, 0, width, height);

    const m = core.monster();
    for (const s of swooshes) drawSwoosh(s);
    drawMonster(m);
    if (m.stunned) drawOrbitingStars(m);
    if (m.caught) drawBubble(m);
    for (const p of particles) drawStar(p.x, p.y, p.size * (p.life / p.maxLife + 0.3), p.angle, p.color);
    for (const p of popups) drawPopup(p);
    drawDizzyMeter(m, width);
  }

  /** Bob of the bubble once caught, so it floats. Visual only. */
  function bubbleBob(m: MonsterView) {
    return m.caught ? Math.sin(caughtFor * 2) * 8 - Math.min(caughtFor, 1) * 20 : 0;
  }

  function drawMonster(m: MonsterView) {
    // Squash & stretch: a Bonk flattens it, then it springs back with an overshoot.
    let sx = 1;
    let sy = 1;
    if (squash > 0) {
      const t = 1 - squash / SQUASH_SECONDS; // 0 → 1
      const amount = Math.cos(t * Math.PI * 3) * (1 - t) * 0.35;
      sx = 1 + amount;
      sy = 1 - amount;
    } else if (m.stunned) {
      // Wobble in place while Stunned.
      const w = Math.sin(time * 22) * 0.08;
      sx = 1 + w;
      sy = 1 - w;
    }
    // Stretch along the direction of travel, more when dashing.
    const speed = Math.hypot(m.vx, m.vy);
    const stretch = Math.min(speed / 2000, 0.25);
    const heading = Math.atan2(m.vy, m.vx);

    ctx.save();
    ctx.translate(m.x, m.y + bubbleBob(m));
    if (stretch > 0.01) {
      ctx.rotate(heading);
      ctx.scale(1 + stretch, 1 - stretch * 0.6);
      ctx.rotate(-heading);
    }
    if (wallBump > 0) {
      // Flattened against the wall, with the wall-side edge staying put, then springing back.
      const t = 1 - wallBump / WALL_BUMP_SECONDS; // 0 → 1
      const amount = Math.cos(t * Math.PI * 2.5) * (1 - t) * 0.4;
      ctx.rotate(wallAngle);
      // Distance from the centre to the wall-side edge.
      const toWall = Math.abs(Math.cos(wallAngle)) * halfW(m) + Math.abs(Math.sin(wallAngle)) * halfH(m);
      ctx.translate(toWall * amount, 0);
      ctx.scale(1 - amount, 1 + amount * 0.6);
      ctx.rotate(-wallAngle);
    }
    ctx.scale(sx, sy);
    if (m.stunned && squash === 0 && wallBump === 0) ctx.rotate(Math.sin(time * 11) * 0.12);

    ctx.drawImage(image, -halfW(m), -halfH(m), m.width, m.height);

    // Stand-in eyes near the top of the drawing, so spiral and sleepy eyes
    // still show. The kid's own Googly Eyes replace these in ticket 07.
    const r = Math.min(halfW(m), halfH(m));
    ctx.strokeStyle = INK;
    for (const side of [-1, 1]) {
      const ex = side * Math.min(halfW(m) * 0.4, r * 0.45);
      const ey = -halfH(m) * 0.45;
      const er = Math.max(10, r * 0.28);
      ctx.fillStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (hasSpiralEyes(m)) {
        drawSpiral(ex, ey, er * 0.85, time * 6 * side);
      } else {
        // Pupils look where it's heading.
        const look = speed > 0 ? er * 0.35 : 0;
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(ex + Math.cos(heading) * look, ey + Math.sin(heading) * look, er * 0.4, 0, Math.PI * 2);
        ctx.fill();
        if (m.sleepy) {
          // Droopy eyelids.
          ctx.fillStyle = LID;
          ctx.beginPath();
          ctx.arc(ex, ey, er + 1.5, Math.PI, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(ex - er, ey);
          ctx.lineTo(ex + er, ey);
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    if (m.sleepy && !m.caught) {
      ctx.fillStyle = INK;
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      const zz = (time * 0.8) % 1;
      ctx.globalAlpha = 1 - zz;
      ctx.fillText("z", m.x + halfW(m) * 0.8 + zz * 20, m.y - halfH(m) - zz * 40);
      ctx.globalAlpha = 1;
    }
  }

  function drawSwoosh(s: Swoosh) {
    if (s.path.length < 2) return;
    const t = s.life / SWOOSH_SECONDS; // 1 → 0
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = t;
    for (const [color, width] of [[INK, 26], ["#ffffff", 16]] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width * t;
      ctx.beginPath();
      ctx.moveTo(s.path[0].x, s.path[0].y);
      for (const p of s.path.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSpiral(cx: number, cy: number, r: number, rotation: number) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const turns = 3;
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const a = t * turns * Math.PI * 2;
      const rr = t * r;
      if (i === 0) ctx.moveTo(0, 0);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawOrbitingStars(m: MonsterView) {
    for (let i = 0; i < 3; i++) {
      const a = time * 5 + (i * Math.PI * 2) / 3;
      const x = m.x + Math.cos(a) * halfW(m) * 0.9;
      const y = m.y - halfH(m) * 1.05 + Math.sin(a) * halfH(m) * 0.25;
      drawStar(x, y, 12, a, STAR_COLORS[i]);
    }
  }

  function drawBubble(m: MonsterView) {
    const grow = Math.min(caughtFor / 0.3, 1);
    // Big enough to hold the whole drawing, corners and all.
    const r = Math.hypot(halfW(m), halfH(m)) * (1 + 0.2 * grow);
    const y = m.y + bubbleBob(m);
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#bde7ff";
    ctx.beginPath();
    ctx.arc(m.x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#6ec6ff";
    ctx.lineWidth = 5;
    ctx.stroke();
    // Shine.
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(m.x, y, r * 0.75, Math.PI * 1.1, Math.PI * 1.4);
    ctx.stroke();
    ctx.restore();
  }

  function drawStar(x: number, y: number, size: number, angle: number, color: string) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size : size * 0.45;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawPopup(p: Popup) {
    const t = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2);
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = INK;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }

  /** One pip per step of Dizzy, across the top of the arena. */
  function drawDizzyMeter(m: MonsterView, arenaWidth: number) {
    const pip = 34;
    const gap = 12;
    const total = m.fullDizzy * pip + (m.fullDizzy - 1) * gap;
    const left = (arenaWidth - total) / 2;
    const y = 44;
    const full = hasSpiralEyes(m);
    const pulse = full ? 1 + Math.sin(time * 8) * 0.12 : 1;
    for (let i = 0; i < m.fullDizzy; i++) {
      const cx = left + i * (pip + gap) + pip / 2;
      const filled = i < m.dizzy || m.caught;
      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(pulse, pulse);
      ctx.beginPath();
      ctx.arc(0, 0, pip / 2, 0, Math.PI * 2);
      ctx.fillStyle = filled ? (full ? "#ffd23f" : "#b388ff") : "#ffffff";
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.stroke();
      if (filled) drawSpiral(0, 0, pip * 0.32, time * 4);
      ctx.restore();
    }
  }

  return { resize, toArena, showTap, showFlick, draw };
}
