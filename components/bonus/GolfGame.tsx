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

const TEE = { x: 90, y: HEIGHT - 60 };
const HOLE = { x: WIDTH - 90, y: 70 };

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
      return {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
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
        const collisionRadius = HOLE_CAPTURE_RADIUS + BALL_RADIUS * 0.4;
        if (distToHole < HOLE_CAPTURE_RADIUS && speed(b) < MAX_SINK_SPEED && lit) {
          sunk.current = true;
          onWin();
        } else if (distToHole < collisionRadius && speed(b) > 0.01) {
          // Close enough to sink, but the hole isn't lit (bad timing) or
          // the ball is moving too fast — bounce off the rim instead.
          const nx = (b.x - HOLE.x) / (distToHole || 1);
          const ny = (b.y - HOLE.y) / (distToHole || 1);
          b.x = HOLE.x + nx * collisionRadius;
          b.y = HOLE.y + ny * collisionRadius;
          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * 0.7;
          b.vy = (b.vy - 2 * dot * ny) * 0.7;
        } else if (isResting()) {
          b.vx = 0;
          b.vy = 0;
          scheduleReset();
        }
      }

      draw(ctx, lit);
      frame = requestAnimationFrame(step);
    }

    function draw(context: CanvasRenderingContext2D, lit: boolean) {
      context.clearRect(0, 0, WIDTH, HEIGHT);
      context.fillStyle = "#05070d";
      context.fillRect(0, 0, WIDTH, HEIGHT);

      // Course grid, in the site's own palette.
      context.strokeStyle = "rgba(34, 211, 238, 0.18)";
      context.lineWidth = 1;
      for (let x = 0; x <= WIDTH; x += 30) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, HEIGHT);
        context.stroke();
      }
      for (let y = 0; y <= HEIGHT; y += 30) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(WIDTH, y);
        context.stroke();
      }

      // Hole — a pair of eyes blink lit/dark on a cycle; the ball only
      // sinks while they're lit.
      context.beginPath();
      context.arc(HOLE.x, HOLE.y, HOLE_RADIUS, 0, Math.PI * 2);
      context.fillStyle = "#0b1220";
      context.fill();
      context.strokeStyle = "#a78bfa";
      context.lineWidth = 2;
      context.stroke();
      context.shadowColor = "#a78bfa";
      context.shadowBlur = 14;
      context.stroke();
      context.shadowBlur = 0;

      const eyeColor = lit ? "#fde68a" : "rgba(253, 230, 138, 0.25)";
      const eyeOffset = 6;
      context.fillStyle = eyeColor;
      if (lit) {
        context.shadowColor = "#fde68a";
        context.shadowBlur = 10;
      }
      for (const dx of [-eyeOffset, eyeOffset]) {
        context.beginPath();
        context.arc(HOLE.x + dx, HOLE.y - 2, 2.5, 0, Math.PI * 2);
        context.fill();
      }
      context.shadowBlur = 0;

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

      // Ball — shrinks out once sunk, for a small win flourish.
      const b = ball.current;
      const radius = sunk.current ? Math.max(0, BALL_RADIUS - 6) : BALL_RADIUS;
      context.beginPath();
      context.arc(b.x, b.y, radius, 0, Math.PI * 2);
      context.fillStyle = "#e8eef5";
      context.shadowColor = "#22d3ee";
      context.shadowBlur = 10;
      context.fill();
      context.shadowBlur = 0;
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
      <p className="text-p2 text-foreground-subtle mb-3">
        Grab the ball, pull back, and let go. The hole only opens when
        its eyes light up — time it right.
      </p>
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
