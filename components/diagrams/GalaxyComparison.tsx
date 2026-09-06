"use client";

import { useEffect, useRef } from "react";

// Plain Canvas 2D, not WebGL — the first version used three.js, but
// three's WebGL context failed to initialize entirely on a real machine
// (software-rendered Mesa/llvmpipe VM): "Could not create a WebGL
// context." WebGL being a browser-native API doesn't guarantee a context
// is actually available; Canvas 2D always is, and it's the same
// approach the golf game already relies on successfully.
const WIDTH = 600;
const HEIGHT = 340;

// Perspective is faked by squashing the vertical axis, standing in for
// the tilted-camera look the original 3D version had.
const SQUASH = 0.38;

function makeStarSprite(color: string, radiusPx: number): HTMLCanvasElement {
  const size = radiusPx * 2;
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    radiusPx, radiusPx, 0,
    radiusPx, radiusPx, radiusPx
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.4, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return sprite;
}

interface Star {
  angle: number;
  radius: number;
  size: number;
  sprite: HTMLCanvasElement;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  star: { size: number; sprite: HTMLCanvasElement }
) {
  const s = star.size;
  ctx.drawImage(star.sprite, x - s, y - s, s * 2, s * 2);
}

function SpiralGalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Each arm is a strand in one of Google's own brand colors — the
    // point isn't decoration, it's making the linear, single-path nature
    // of each strand legible as distinctly "Google."
    const ARM_SPRITES = [
      makeStarSprite("#4285F4", 6), // blue
      makeStarSprite("#EA4335", 6), // red
      makeStarSprite("#FBBC05", 6), // yellow
      makeStarSprite("#34A853", 6), // green
    ];
    const whiteSprite = makeStarSprite("#ffffff", 8);

    const ARMS = ARM_SPRITES.length;
    const PER_ARM = 165;
    const MAX_RADIUS = Math.min(WIDTH, HEIGHT) * 0.42;
    const stars: Star[] = [];
    for (let arm = 0; arm < ARMS; arm++) {
      const armOffset = (arm / ARMS) * Math.PI * 2;
      for (let j = 0; j < PER_ARM; j++) {
        const t = j / PER_ARM;
        const radius = t * MAX_RADIUS;
        const angle = armOffset + t * Math.PI * 2.6 + (Math.random() - 0.5) * 0.25;
        stars.push({
          angle,
          radius: radius + (Math.random() - 0.5) * MAX_RADIUS * 0.05,
          size: 1.2 + Math.random() * 1.6,
          sprite: ARM_SPRITES[arm],
        });
      }
    }

    // The single highlighted path: one bright route spiraling from the
    // rim straight to the center.
    const PATH_POINTS = 70;
    const pathStars: Star[] = [];
    for (let j = 0; j < PATH_POINTS; j++) {
      const t = j / (PATH_POINTS - 1);
      pathStars.push({
        angle: t * Math.PI * 2.6,
        radius: (1 - t) * MAX_RADIUS,
        size: 2,
        sprite: whiteSprite,
      });
    }

    let frame: number;
    const start = performance.now();
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    function render(now: number) {
      if (!ctx) return;
      const rotation = (now - start) * 0.00012;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.globalCompositeOperation = "lighter";
      for (const star of stars) {
        const a = star.angle + rotation;
        const x = cx + Math.cos(a) * star.radius;
        const y = cy + Math.sin(a) * star.radius * SQUASH;
        drawStar(ctx, x, y, star);
      }
      for (const star of pathStars) {
        const a = star.angle + rotation;
        const x = cx + Math.cos(a) * star.radius;
        const y = cy + Math.sin(a) * star.radius * SQUASH;
        drawStar(ctx, x, y, star);
      }
      ctx.globalCompositeOperation = "source-over";
      frame = requestAnimationFrame(render);
    }
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

// Palette for spawned galaxies. Each spawn picks one at random (repeats
// allowed) rather than cycling in order, so simultaneous galaxies don't
// fall into a predictable pattern.
const GALAXY_COLORS = ["#a78bfa", "#ec4899", "#22d3ee", "#fbbf24", "#34d399"];

const MAX_GALAXIES = 6;
const FADE_IN_MS = 2500;
const STEADY_MS = 12000;
const FADE_OUT_MS = 3000;
const GALAXY_LIFESPAN_MS = FADE_IN_MS + STEADY_MS + FADE_OUT_MS;
const SPAWN_GAP_MIN_MS = 2500;
const SPAWN_GAP_MAX_MS = 5000;

// Radial drift outward from the canvas center over a galaxy's lifetime —
// what actually sells "the universe is ever expanding" as motion instead
// of a claim sitting next to a static image. Tuned against the panel's
// own size so a galaxy has visibly separated from center well before its
// fade-out — too slow and every galaxy just piles up in the middle
// instead of reading as distinct, spreading bodies.
const DRIFT_PX_PER_MS = 0.013;

interface OrbitStar {
  initialAngle: number;
  baseRadius: number;
  size: number;
  sprite: HTMLCanvasElement;
  speedJitter: number; // ~0.9-1.1, keeps rotation from looking perfectly rigid
  wobbleAmp: number;
  wobblePhase: number;
}

interface Galaxy {
  id: number;
  bornAt: number;
  originX: number;
  originY: number;
  driftAngle: number; // direction of outward drift from canvas center
  clusterRadius: number;
  coreRadius: number; // solid-body core; flat rotation curve past this
  rotationDir: 1 | -1;
  angularSpeed: number;
  stars: OrbitStar[];
  haloColor: string;
}

interface LightPulse {
  fromId: number;
  toId: number;
  startedAt: number;
  durationMs: number;
  curveOffset: number;
}

function makeGalaxy(id: number, now: number, cx: number, cy: number): Galaxy {
  const clusterRadius = Math.min(WIDTH, HEIGHT) * (0.1 + Math.random() * 0.06);
  const color = GALAXY_COLORS[Math.floor(Math.random() * GALAXY_COLORS.length)];
  const sprite = makeStarSprite(color, 6);
  const starCount = 220 + Math.floor(Math.random() * 130);
  const stars: OrbitStar[] = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      initialAngle: Math.random() * Math.PI * 2,
      baseRadius: Math.random() * clusterRadius,
      size: 1.1 + Math.random() * 1.5,
      sprite,
      speedJitter: 0.9 + Math.random() * 0.2,
      wobbleAmp: clusterRadius * (0.02 + Math.random() * 0.04),
      wobblePhase: Math.random() * Math.PI * 2,
    });
  }

  // New galaxies appear nearer the center; existing ones have already
  // drifted outward, which is what makes the whole field read as
  // expanding rather than just a static scatter of unrelated clusters.
  const spawnRadius = Math.min(WIDTH, HEIGHT) * (0.05 + Math.random() * 0.12);
  const driftAngle = Math.random() * Math.PI * 2;

  return {
    id,
    bornAt: now,
    originX: cx + Math.cos(driftAngle) * spawnRadius,
    originY: cy + Math.sin(driftAngle) * spawnRadius * SQUASH,
    driftAngle,
    clusterRadius,
    coreRadius: clusterRadius * 0.25,
    rotationDir: Math.random() < 0.5 ? 1 : -1,
    angularSpeed: 0.45 + Math.random() * 0.15,
    stars,
    haloColor: color,
  };
}

/** Opacity from a galaxy's fade-in / steady / fade-out lifecycle. Negative once dead. */
function galaxyOpacity(galaxy: Galaxy, now: number): number {
  const age = now - galaxy.bornAt;
  if (age < FADE_IN_MS) return age / FADE_IN_MS;
  if (age < FADE_IN_MS + STEADY_MS) return 1;
  if (age < GALAXY_LIFESPAN_MS) {
    return 1 - (age - FADE_IN_MS - STEADY_MS) / FADE_OUT_MS;
  }
  return -1;
}

/** Current center of a galaxy, after its outward drift. */
function galaxyCenter(galaxy: Galaxy, now: number, cx: number, cy: number) {
  const age = now - galaxy.bornAt;
  const driftDist = age * DRIFT_PX_PER_MS;
  return {
    x: galaxy.originX + Math.cos(galaxy.driftAngle) * driftDist,
    y: galaxy.originY + Math.sin(galaxy.driftAngle) * driftDist * SQUASH,
  };
}

/**
 * Angular velocity as a function of radius: solid-body rotation inside
 * the core, then flat past it (linear speed ~constant, so angular speed
 * falls off as 1/radius). This is the actual astrophysical signature of
 * dark matter — real spiral galaxies rotate this way, which is not what
 * gravity from visible mass alone predicts. The motion doubles as both
 * "real gravity at work" and "signs of dark matter" without drawing
 * anything literal.
 */
function angularSpeedAtRadius(galaxy: Galaxy, radius: number): number {
  const effectiveRadius = Math.max(radius, galaxy.coreRadius);
  return (galaxy.angularSpeed * galaxy.coreRadius) / effectiveRadius;
}

function drawGalaxy(
  ctx: CanvasRenderingContext2D,
  galaxy: Galaxy,
  now: number,
  cx: number,
  cy: number,
  opacity: number
) {
  const center = galaxyCenter(galaxy, now, cx, cy);
  const t = now / 1000;

  // Faint halo, larger than the visible star field — the closest thing
  // to a "dark matter" shape on screen, mostly there so the flat-curve
  // motion above feels physically grounded rather than arbitrary.
  const haloRadius = galaxy.clusterRadius * 1.7;
  const halo = ctx.createRadialGradient(
    center.x, center.y, 0,
    center.x, center.y, haloRadius
  );
  halo.addColorStop(0, galaxy.haloColor);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = opacity * 0.05;
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, haloRadius, haloRadius * SQUASH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.globalAlpha = opacity;
  for (const star of galaxy.stars) {
    const age = now - galaxy.bornAt;
    const wobble = Math.sin(age * 0.0006 + star.wobblePhase) * star.wobbleAmp;
    const radius = star.baseRadius + wobble;
    const speed = angularSpeedAtRadius(galaxy, star.baseRadius) * star.speedJitter;
    const angle = star.initialAngle + galaxy.rotationDir * speed * t;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius * SQUASH;
    drawStar(ctx, x, y, star);
  }
  ctx.globalAlpha = 1;
}

function AgenticUniverseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const whiteSprite = makeStarSprite("#ffffff", 5);
    const pulseStar: Star = { angle: 0, radius: 0, size: 2, sprite: whiteSprite };

    let nextId = 0;
    const galaxies: Galaxy[] = [];
    const pulses: LightPulse[] = [];
    const start = performance.now();

    // Seed a few galaxies already mid-life so the animation opens
    // populated instead of empty.
    for (let i = 0; i < 3; i++) {
      const galaxy = makeGalaxy(nextId++, start, cx, cy);
      galaxy.bornAt = start - (FADE_IN_MS + Math.random() * STEADY_MS * 0.6);
      galaxies.push(galaxy);
    }
    let lastSpawnAt = start;
    let lastPulseAt = start;

    let frame: number;

    function render(now: number) {
      if (!ctx) return;

      // Remove galaxies whose fade-out has finished.
      for (let i = galaxies.length - 1; i >= 0; i--) {
        if (galaxyOpacity(galaxies[i], now) < 0) galaxies.splice(i, 1);
      }

      // Spawn a new galaxy once there's room and enough time has passed —
      // this is what keeps the field "ever expanding" rather than settling
      // into a fixed cast.
      if (
        galaxies.length < MAX_GALAXIES &&
        now - lastSpawnAt > SPAWN_GAP_MIN_MS + Math.random() * (SPAWN_GAP_MAX_MS - SPAWN_GAP_MIN_MS)
      ) {
        galaxies.push(makeGalaxy(nextId++, now, cx, cy));
        lastSpawnAt = now;
      }

      // Sparse, intermittent connections between galaxies — a pair
      // "communicates" occasionally, not constantly, and not every pair
      // ever does. The pulse itself is the flicker of visible light.
      if (galaxies.length >= 2 && now - lastPulseAt > 1400 + Math.random() * 1800) {
        const a = galaxies[Math.floor(Math.random() * galaxies.length)];
        let b = galaxies[Math.floor(Math.random() * galaxies.length)];
        if (b.id !== a.id) {
          pulses.push({
            fromId: a.id,
            toId: b.id,
            startedAt: now,
            durationMs: 900 + Math.random() * 700,
            curveOffset: (Math.random() - 0.5) * 40,
          });
        }
        lastPulseAt = now;
      }

      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.globalCompositeOperation = "lighter";

      for (const galaxy of galaxies) {
        const opacity = Math.max(0, galaxyOpacity(galaxy, now));
        drawGalaxy(ctx, galaxy, now, cx, cy, opacity);
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        const progress = (now - pulse.startedAt) / pulse.durationMs;
        if (progress >= 1) {
          pulses.splice(i, 1);
          continue;
        }
        const from = galaxies.find(g => g.id === pulse.fromId);
        const to = galaxies.find(g => g.id === pulse.toId);
        if (!from || !to) {
          pulses.splice(i, 1);
          continue;
        }
        const fromC = galaxyCenter(from, now, cx, cy);
        const toC = galaxyCenter(to, now, cx, cy);
        // Gentle bend in the path rather than a straight line — a light
        // touch suggesting the pulse's path isn't unaffected by what it
        // passes near, without drawing gravity as a literal shape.
        const midX = (fromC.x + toC.x) / 2 + pulse.curveOffset;
        const midY = (fromC.y + toC.y) / 2 - pulse.curveOffset * SQUASH;
        const x = (1 - progress) ** 2 * fromC.x + 2 * (1 - progress) * progress * midX + progress ** 2 * toC.x;
        const y = (1 - progress) ** 2 * fromC.y + 2 * (1 - progress) * progress * midY + progress ** 2 * toC.y;
        // Fade in over the first 15% of travel, fade out over the last 15%.
        const edgeFade = Math.min(progress / 0.15, (1 - progress) / 0.15, 1);
        ctx.globalAlpha = edgeFade;
        drawStar(ctx, x, y, pulseStar);
        ctx.globalAlpha = 1;
      }

      ctx.globalCompositeOperation = "source-over";
      frame = requestAnimationFrame(render);
    }
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

function GalaxyPanel({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="rounded-lg border border-border overflow-hidden bg-background-elevated">
        <div className="h-64 sm:h-80" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
          {children}
        </div>
      </div>
      <p className="mt-3 text-p2 font-semibold text-foreground">{label}</p>
      <p className="text-p2 text-foreground-secondary">{caption}</p>
    </div>
  );
}

export function GalaxyComparison() {
  return (
    <div className="my-8 flex flex-col sm:flex-row gap-6">
      <GalaxyPanel
        label="The Google Galaxy"
        caption="A known structure, a single path from the edge to a result. Search was traversal."
      >
        <SpiralGalaxyCanvas />
      </GalaxyPanel>
      <GalaxyPanel
        label="The Agentic Galaxy"
        caption="Multiple systems interacting, exchanging context continuously. Agency is interaction."
      >
        <AgenticUniverseCanvas />
      </GalaxyPanel>
    </div>
  );
}

// Standalone single-panel embeds, for dropping each galaxy in at its own
// point in the chapter's prose rather than side by side. No caption text
// — the surrounding paragraph is already carrying that.
function SoloPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 rounded-lg border border-border overflow-hidden bg-background-elevated">
      <div className="h-72 sm:h-96" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
        {children}
      </div>
    </div>
  );
}

export function GoogleGalaxy() {
  return (
    <SoloPanel>
      <SpiralGalaxyCanvas />
    </SoloPanel>
  );
}

export function AgenticGalaxy() {
  return (
    <SoloPanel>
      <AgenticUniverseCanvas />
    </SoloPanel>
  );
}
