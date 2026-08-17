"use client";

import { useEffect, useRef } from "react";

// Logical course size — the canvas is drawn at this resolution and
// scaled to fit its container via CSS, so all physics/constants below
// are in these logical units regardless of actual pixel size on screen.
const WIDTH = 600;
const HEIGHT = 360;
const BALL_RADIUS = 9;
const HOLE_RADIUS = 16;
const HOLE_CAPTURE_RADIUS = 20;
const MAX_SINK_SPEED = 4.2;
const FRICTION = 0.985;
const REST_SPEED = 0.06;
const MAX_PULL = 130;
const LAUNCH_POWER = 0.11;
const RESET_DELAY_MS = 700;

// The hole "blinks" — like the mouse hole's eyes in Zany Golf — and only
// accepts the ball while lit. Arriving while it's dark bounces the ball
// off instead of sinking, so timing matters as much as aim and power.
const HOLE_BLINK_PERIOD_MS = 1800;
const HOLE_LIT_DURATION_MS = 500;
const SINK_ANIMATION_MS = 800;

const TEE = { x: 90, y: HEIGHT - 60 };
const HOLE = { x: WIDTH - 90, y: 70 };

// Isometric projection applied only at draw/input time — physics still
// simulate on the plain flat plane above (unchanged, already-tuned
// friction/bounce/capture math), and this shear+scale matrix is what
// makes that flat plane render as a tilted isometric floor, matching
// the real game's look instead of a flat top-down grid.
const ISO_K = 0.5;
const ISO_OFFSET_X = 240;
// Extra headroom above the floor's back corner for walls/machinery to
// rise into, without going off the top of the canvas.
const ISO_OFFSET_Y = 80;
const WALL_HEIGHT = 55;

function toScreen(x: number, y: number): { x: number; y: number } {
  return {
    x: ISO_K * (x - y) + ISO_OFFSET_X,
    y: (ISO_K / 2) * (x + y) + ISO_OFFSET_Y,
  };
}

function toLogical(sx: number, sy: number): { x: number; y: number } {
  const dx = sx - ISO_OFFSET_X;
  const dy = sy - ISO_OFFSET_Y;
  return {
    x: (dx / ISO_K + 2 * (dy / ISO_K)) / 2,
    y: (2 * (dy / ISO_K) - dx / ISO_K) / 2,
  };
}

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function GolfGame({ onWin }: { onWin: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ball = useRef<BallState>({ x: TEE.x, y: TEE.y, vx: 0, vy: 0 });
  const dragging = useRef(false);
  const dragPoint = useRef({ x: TEE.x, y: TEE.y });
  const sunk = useRef(false);
  const sunkAt = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context2d = canvas.getContext("2d");
    if (!context2d) return;
    const ctx: CanvasRenderingContext2D = context2d;

    let frame: number;
    const startTime = performance.now();

    function isHoleLit(now: number): boolean {
      return ((now - startTime) % HOLE_BLINK_PERIOD_MS) < HOLE_LIT_DURATION_MS;
    }

    function pointerPos(event: PointerEvent): { x: number; y: number } {
      const rect = canvas!.getBoundingClientRect();
      const canvasX = ((event.clientX - rect.left) / rect.width) * WIDTH;
      const canvasY = ((event.clientY - rect.top) / rect.height) * HEIGHT;
      // The scene renders through the isometric transform, so pointer
      // input has to go through its inverse to land back in the same
      // flat logical space the ball's physics actually live in.
      return toLogical(canvasX, canvasY);
    }

    function speed(b: BallState): number {
      return Math.hypot(b.vx, b.vy);
    }

    function isResting(): boolean {
      return speed(ball.current) < REST_SPEED;
    }

    function scheduleReset() {
      if (resetTimer.current || sunk.current) return;
      resetTimer.current = setTimeout(() => {
        ball.current = { x: TEE.x, y: TEE.y, vx: 0, vy: 0 };
        resetTimer.current = null;
      }, RESET_DELAY_MS);
    }

    function handlePointerDown(event: PointerEvent) {
      if (sunk.current || !isResting()) return;
      const p = pointerPos(event);
      if (Math.hypot(p.x - ball.current.x, p.y - ball.current.y) > 40) return;
      dragging.current = true;
      dragPoint.current = p;
      canvas!.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragging.current) return;
      dragPoint.current = pointerPos(event);
    }

    function handlePointerUp() {
      if (!dragging.current) return;
      dragging.current = false;
      const b = ball.current;
      let dx = b.x - dragPoint.current.x;
      let dy = b.y - dragPoint.current.y;
      const pull = Math.hypot(dx, dy);
      if (pull > MAX_PULL) {
        dx = (dx / pull) * MAX_PULL;
        dy = (dy / pull) * MAX_PULL;
      }
      b.vx = dx * LAUNCH_POWER;
      b.vy = dy * LAUNCH_POWER;
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    function step() {
      const b = ball.current;
      const now = performance.now();
      const lit = isHoleLit(now);

      if (!sunk.current && !dragging.current) {
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= FRICTION;
        b.vy *= FRICTION;

        if (b.x - BALL_RADIUS < 0) {
          b.x = BALL_RADIUS;
          b.vx *= -0.6;
        } else if (b.x + BALL_RADIUS > WIDTH) {
          b.x = WIDTH - BALL_RADIUS;
          b.vx *= -0.6;
        }
        if (b.y - BALL_RADIUS < 0) {
          b.y = BALL_RADIUS;
          b.vy *= -0.6;
        } else if (b.y + BALL_RADIUS > HEIGHT) {
          b.y = HEIGHT - BALL_RADIUS;
          b.vy *= -0.6;
        }

        const distToHole = Math.hypot(b.x - HOLE.x, b.y - HOLE.y);
        // Both checks share the same radius — the sink check must get
        // first refusal exactly where the ball actually enters the hole,
        // not at some larger outer radius the ball would bounce off of
        // before ever reaching the real capture zone.
        if (distToHole < HOLE_CAPTURE_RADIUS && speed(b) < MAX_SINK_SPEED && lit) {
          sunk.current = true;
          sunkAt.current = now;
          onWin();
        } else if (distToHole < HOLE_CAPTURE_RADIUS && speed(b) > 0.01) {
          // Close enough to sink, but the hole isn't lit (bad timing) or
          // the ball is moving too fast — bounce off the rim instead.
          const nx = (b.x - HOLE.x) / (distToHole || 1);
          const ny = (b.y - HOLE.y) / (distToHole || 1);
          b.x = HOLE.x + nx * HOLE_CAPTURE_RADIUS;
          b.y = HOLE.y + ny * HOLE_CAPTURE_RADIUS;
          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * 0.7;
          b.vy = (b.vy - 2 * dot * ny) * 0.7;
        } else if (isResting()) {
          b.vx = 0;
          b.vy = 0;
          scheduleReset();
        }
      }

      draw(ctx, lit, now);
      frame = requestAnimationFrame(step);
    }

    // Decorative pipe segments, purely cosmetic — the industrial-machinery
    // energy from the reference, drawn in the site's own steel/cyan tones
    // rather than copied wholesale.
    function drawPipe(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      length: number,
      vertical: boolean
    ) {
      context.save();
      context.strokeStyle = "rgba(148, 163, 184, 0.35)";
      context.lineWidth = 8;
      context.lineCap = "round";
      context.beginPath();
      if (vertical) {
        context.moveTo(x, y);
        context.lineTo(x, y + length);
      } else {
        context.moveTo(x, y);
        context.lineTo(x + length, y);
      }
      context.stroke();
      context.strokeStyle = "rgba(226, 232, 240, 0.15)";
      context.lineWidth = 2;
      context.stroke();
      context.restore();
    }

    // A small pedestal with a pulsing energy ring floating above it — our
    // own take on the reference's pickup-on-a-pedestal prop.
    function drawPedestal(
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      color: string,
      now: number,
      phase: number
    ) {
      const top = drawIsoBlock(context, cx, cy, 12, 9, 10, "#3a3f4d", "#20222c");
      const pulse = 0.6 + 0.4 * Math.sin(now / 500 + phase);
      context.save();
      context.globalAlpha = 0.35 + 0.35 * pulse;
      context.beginPath();
      context.arc(top.x, top.y - 14, 7, 0, Math.PI * 2);
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.shadowColor = color;
      context.shadowBlur = 8 * pulse;
      context.stroke();
      context.restore();
    }

    // A wall rising WALL_HEIGHT px from a floor-plane edge (logical
    // coordinates), drawn in plain screen space via toScreen — computed
    // here rather than inside the floor's sheared transform, since a
    // vertical rise on screen isn't a straight line in logical space
    // once you've applied the shear.
    function drawIsoWall(
      context: CanvasRenderingContext2D,
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      color: string,
      lightColor: string
    ) {
      const a = toScreen(fromX, fromY);
      const b = toScreen(toX, toY);
      context.save();
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.lineTo(b.x, b.y - WALL_HEIGHT);
      context.lineTo(a.x, a.y - WALL_HEIGHT);
      context.closePath();
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = lightColor;
      context.lineWidth = 1;
      context.stroke();
      context.restore();
    }

    // A simple raised block (console/pedestal), footprint centered at a
    // logical point, drawn as a top face plus two visible side faces —
    // same screen-space technique as the walls.
    function drawIsoBlock(
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      halfW: number,
      halfD: number,
      height: number,
      topColor: string,
      sideColor: string
    ) {
      const corners = [
        toScreen(cx - halfW, cy - halfD),
        toScreen(cx + halfW, cy - halfD),
        toScreen(cx + halfW, cy + halfD),
        toScreen(cx - halfW, cy + halfD),
      ];
      context.save();
      // Left face (front-left corner pair).
      context.beginPath();
      context.moveTo(corners[0].x, corners[0].y);
      context.lineTo(corners[3].x, corners[3].y);
      context.lineTo(corners[3].x, corners[3].y - height);
      context.lineTo(corners[0].x, corners[0].y - height);
      context.closePath();
      context.fillStyle = sideColor;
      context.fill();
      // Right face (front-right corner pair).
      context.beginPath();
      context.moveTo(corners[2].x, corners[2].y);
      context.lineTo(corners[3].x, corners[3].y);
      context.lineTo(corners[3].x, corners[3].y - height);
      context.lineTo(corners[2].x, corners[2].y - height);
      context.closePath();
      context.fillStyle = sideColor;
      context.fill();
      // Top face.
      context.beginPath();
      context.moveTo(corners[0].x, corners[0].y - height);
      context.lineTo(corners[1].x, corners[1].y - height);
      context.lineTo(corners[2].x, corners[2].y - height);
      context.lineTo(corners[3].x, corners[3].y - height);
      context.closePath();
      context.fillStyle = topColor;
      context.fill();
      context.restore();
      return { x: (corners[0].x + corners[2].x) / 2, y: corners[0].y - height };
    }

    function draw(
      context: CanvasRenderingContext2D,
      lit: boolean,
      now: number
    ) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, WIDTH, HEIGHT);
      context.fillStyle = "#05070d";
      context.fillRect(0, 0, WIDTH, HEIGHT);

      // Back walls, in screen space — the room enclosure the flat floor
      // was missing. Tron-accented panel lines rather than bare steel.
      drawIsoWall(context, 0, 0, WIDTH, 0, "#171923", "rgba(34, 211, 238, 0.25)");
      drawIsoWall(context, 0, 0, 0, HEIGHT, "#11131c", "rgba(167, 139, 250, 0.2)");

      // A console silhouette against the back corner — our own shape,
      // not a copy of any reference image.
      const consoleTop = drawIsoBlock(context, 120, 90, 34, 26, 42, "#3a3f4d", "#20222c");
      context.save();
      context.fillStyle = "#ef4444";
      context.shadowColor = "#ef4444";
      context.shadowBlur = 6;
      context.beginPath();
      context.arc(consoleTop.x, consoleTop.y + 10, 3, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.restore();

      // Pedestal-mounted energy pickups, decorative only.
      drawPedestal(context, 260, 140, "#a78bfa", now, 0);
      drawPedestal(context, 480, 240, "#ec4899", now, 1.4);
      drawPedestal(context, 340, 300, "#a78bfa", now, 2.6);

      // Everything below renders through the isometric shear so the flat
      // physics plane above reads as a tilted floor, like the real game.
      context.save();
      context.transform(ISO_K, ISO_K / 2, -ISO_K, ISO_K / 2, ISO_OFFSET_X, ISO_OFFSET_Y);

      // Floor — a filled tile checker in muted steel/maroon tones (the
      // reference's palette), not the site's own cyan.
      context.fillStyle = "#2a2230";
      context.fillRect(0, 0, WIDTH, HEIGHT);
      const TILE = 30;
      for (let ty = 0; ty < HEIGHT; ty += TILE) {
        for (let tx = 0; tx < WIDTH; tx += TILE) {
          if (((tx / TILE) + (ty / TILE)) % 2 === 0) {
            context.fillStyle = "rgba(255, 255, 255, 0.035)";
            context.fillRect(tx, ty, TILE, TILE);
          }
        }
      }
      context.strokeStyle = "rgba(255, 255, 255, 0.08)";
      context.lineWidth = 1;
      for (let x = 0; x <= WIDTH; x += TILE) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, HEIGHT);
        context.stroke();
      }
      for (let y = 0; y <= HEIGHT; y += TILE) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(WIDTH, y);
        context.stroke();
      }

      // Pipes running the floor's back edges — flat, so they can stay
      // inside the sheared floor transform along with the tile grid.
      drawPipe(context, 20, 16, WIDTH - 40, false);
      drawPipe(context, WIDTH - 24, 30, HEIGHT - 60, true);

      // Sink animation progress (0 = just sunk, 1 = fully settled/hidden).
      const sinkProgress = sunk.current
        ? Math.min(1, (now - sunkAt.current) / SINK_ANIMATION_MS)
        : 0;

      // Hole — understated rather than a bold ring (the mouse hole barely
      // reads against the scene in the reference too). Eyes are white by
      // default and pulse red on the accept window; the ball only sinks
      // while they're red.
      context.beginPath();
      context.arc(HOLE.x, HOLE.y, HOLE_RADIUS, 0, Math.PI * 2);
      context.fillStyle = "#0b1220";
      context.fill();
      context.strokeStyle = "rgba(167, 139, 250, 0.4)";
      context.lineWidth = 1.5;
      context.stroke();

      if (sinkProgress < 1) {
        const eyeColor = lit ? "#ef4444" : "rgba(232, 238, 245, 0.7)";
        const eyeOffset = 6;
        context.fillStyle = eyeColor;
        if (lit) {
          context.shadowColor = "#ef4444";
          context.shadowBlur = 10;
        }
        for (const dx of [-eyeOffset, eyeOffset]) {
          context.beginPath();
          context.arc(HOLE.x + dx, HOLE.y - 2, 2.5, 0, Math.PI * 2);
          context.fill();
        }
        context.shadowBlur = 0;
      }

      // Flag pin above the hole — sinks down with the ball on a
      // successful shot, both fading out together.
      const flagBaseY = HOLE.y - HOLE_RADIUS - 4;
      const flagDrop = sunk.current ? sinkProgress * 34 : 0;
      const flagOpacity = sunk.current ? 1 - sinkProgress : 1;
      context.save();
      context.globalAlpha = flagOpacity;
      context.strokeStyle = "#e8eef5";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(HOLE.x, flagBaseY + flagDrop);
      context.lineTo(HOLE.x, flagBaseY - 26 + flagDrop);
      context.stroke();
      context.beginPath();
      context.moveTo(HOLE.x, flagBaseY - 26 + flagDrop);
      context.lineTo(HOLE.x + 14, flagBaseY - 21 + flagDrop);
      context.lineTo(HOLE.x, flagBaseY - 16 + flagDrop);
      context.closePath();
      context.fillStyle = "#ef4444";
      context.fill();
      context.restore();

      // Aim line while dragging.
      if (dragging.current) {
        const b = ball.current;
        context.beginPath();
        context.setLineDash([6, 6]);
        context.moveTo(b.x, b.y);
        context.lineTo(dragPoint.current.x, dragPoint.current.y);
        context.strokeStyle = "#22d3ee";
        context.lineWidth = 2;
        context.stroke();
        context.setLineDash([]);
      }

      // Ball — drops into the hole and fades out with the flag on a win,
      // instead of just vanishing.
      const b = ball.current;
      if (sinkProgress < 1) {
        context.save();
        context.globalAlpha = sunk.current ? 1 - sinkProgress * 0.7 : 1;
        const dropY = sunk.current ? b.y + sinkProgress * 10 : b.y;
        context.beginPath();
        context.arc(b.x, dropY, BALL_RADIUS, 0, Math.PI * 2);
        context.fillStyle = "#e8eef5";
        context.shadowColor = "#22d3ee";
        context.shadowBlur = 10;
        context.fill();
        context.restore();
      }

      context.restore();
    }

    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [onWin]);

  return (
    <div className="mt-8">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="w-full rounded-lg border border-border touch-none"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      />
    </div>
  );
}
