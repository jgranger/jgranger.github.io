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

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, star: Star) {
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

function InteractingGalaxiesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const violetSprite = makeStarSprite("#a78bfa", 6);
    const magentaSprite = makeStarSprite("#ec4899", 6);
    const whiteSprite = makeStarSprite("#ffffff", 7);

    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const offsetX = WIDTH * 0.19;
    const centerA = { x: cx - offsetX, y: cy };
    const centerB = { x: cx + offsetX, y: cy };
    const CLUSTER_RADIUS = Math.min(WIDTH, HEIGHT) * 0.24;

    interface ClusterStar extends Star { dx: number; dy: number; }

    function makeCluster(sprite: HTMLCanvasElement, count: number): ClusterStar[] {
      const result: ClusterStar[] = [];
      for (let i = 0; i < count; i++) {
        const r = Math.random() * CLUSTER_RADIUS;
        const a = Math.random() * Math.PI * 2;
        result.push({
          angle: a,
          radius: r,
          dx: 0,
          dy: 0,
          size: 1.1 + Math.random() * 1.5,
          sprite,
        });
      }
      return result;
    }

    const clusterA = makeCluster(violetSprite, 350);
    const clusterB = makeCluster(magentaSprite, 350);

    const STREAM_COUNT = 220;
    const streamPhase = new Float32Array(STREAM_COUNT).map(() => Math.random());
    const streamStar: Star = { angle: 0, radius: 0, size: 1.6, sprite: whiteSprite };

    let frame: number;
    const start = performance.now();

    function render(now: number) {
      if (!ctx) return;
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.globalCompositeOperation = "lighter";

      const rotA = t * 0.35;
      for (const star of clusterA) {
        const a = star.angle + rotA;
        const x = centerA.x + Math.cos(a) * star.radius;
        const y = centerA.y + Math.sin(a) * star.radius * SQUASH;
        drawStar(ctx, x, y, star);
      }
      const rotB = -t * 0.28;
      for (const star of clusterB) {
        const a = star.angle + rotB;
        const x = centerB.x + Math.cos(a) * star.radius;
        const y = centerB.y + Math.sin(a) * star.radius * SQUASH;
        drawStar(ctx, x, y, star);
      }

      // Continuous two-way exchange: each particle loops between the two
      // cores on its own offset, not a one-time trip.
      for (let i = 0; i < STREAM_COUNT; i++) {
        const phase = (streamPhase[i] + t * 0.12) % 1;
        const swing = Math.sin(phase * Math.PI);
        const from = i % 2 === 0 ? centerA : centerB;
        const to = i % 2 === 0 ? centerB : centerA;
        const x = from.x + (to.x - from.x) * phase;
        const y = cy + Math.sin(phase * Math.PI * 3 + i) * 20 * swing;
        drawStar(ctx, x, y, streamStar);
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
        <InteractingGalaxiesCanvas />
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
      <InteractingGalaxiesCanvas />
    </SoloPanel>
  );
}
