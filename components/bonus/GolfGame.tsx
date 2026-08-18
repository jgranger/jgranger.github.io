"use client";

import { useEffect, useRef } from "react";

// Canvas resolution matches the background art's aspect ratio
// (1681x467) so drawImage never distorts it.
const WIDTH = 1000;
const HEIGHT = 278;

const BALL_RADIUS = 9;
const HOLE_CAPTURE_RADIUS = 14;
const MAX_SINK_SPEED = 7;
const FRICTION = 0.985;
const REST_SPEED = 0.1;
const MAX_PULL = 217;
const LAUNCH_POWER = 0.11;
const RESET_DELAY_MS = 700;

// The hole's eyes are white by default and pulse red on a fixed cycle —
// like the mouse hole's eyes in Zany Golf — and the ball only sinks
// while they're red. Arriving too fast, or while they're white, bounces
// the ball off instead of sinking.
const HOLE_BLINK_PERIOD_MS = 1800;
const HOLE_LIT_DURATION_MS = 500;
const SINK_ANIMATION_MS = 800;

// Pixel positions calibrated against public/golf-course.png (the
// provided energy-level artwork), scaled from the source image's
// 1681x467 resolution down to this canvas's 1000x278.
const TEE = { x: 158, y: 176 };
const HOLE = { x: 830, y: 89 };

// Approximate path of the turret's beam in the artwork, used only for
// the periodic bright pulse overlay — the beam itself is baked into
// the background image and always faintly visible; this animates an
// extra bright flash along it every so often, per "the pulse is not
// visible by default, but every so often it shoots across the screen."
const BEAM_START = { x: 506, y: 235 };
const BEAM_END = { x: 747, y: 143 };
const BEAM_PULSE_PERIOD_MS = 4200;
const BEAM_PULSE_DURATION_MS = 500;

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

    const bg = new Image();
    bg.src = "/golf-course.jpg";

    let frame: number;
    const startTime = performance.now();

    function isHoleLit(now: number): boolean {
      return ((now - startTime) % HOLE_BLINK_PERIOD_MS) < HOLE_LIT_DURATION_MS;
    }

    function beamPulseStrength(now: number): number {
      const t = (now - startTime) % BEAM_PULSE_PERIOD_MS;
      if (t > BEAM_PULSE_DURATION_MS) return 0;
      // Ease in/out across the pulse window rather than a hard on/off.
      return Math.sin((t / BEAM_PULSE_DURATION_MS) * Math.PI);
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

    function draw(context: CanvasRenderingContext2D, lit: boolean, now: number) {
      context.clearRect(0, 0, WIDTH, HEIGHT);
      if (bg.complete && bg.naturalWidth > 0) {
        context.drawImage(bg, 0, 0, WIDTH, HEIGHT);
      } else {
        context.fillStyle = "#05070d";
        context.fillRect(0, 0, WIDTH, HEIGHT);
      }

      // Periodic bright pulse along the turret beam baked into the
      // artwork — off by default, flashes across every few seconds.
      const pulse = beamPulseStrength(now);
      if (pulse > 0.02) {
        context.save();
        context.globalAlpha = pulse;
        context.strokeStyle = "#e9d5ff";
        context.lineWidth = 4;
        context.shadowColor = "#c084fc";
        context.shadowBlur = 16 * pulse;
        context.beginPath();
        context.moveTo(BEAM_START.x, BEAM_START.y);
        context.lineTo(BEAM_END.x, BEAM_END.y);
        context.stroke();
        context.restore();
      }

      // Sink animation progress (0 = just sunk, 1 = fully settled/hidden).
      const sinkProgress = sunk.current
        ? Math.min(1, (now - sunkAt.current) / SINK_ANIMATION_MS)
        : 0;

      // Hole's eyes — white by default, red on the accept window. Drawn
      // over the artwork's own hole graphic each frame.
      if (sinkProgress < 1) {
        const eyeColor = lit ? "#ef4444" : "rgba(232, 238, 245, 0.7)";
        const eyeOffset = 4;
        context.fillStyle = eyeColor;
        if (lit) {
          context.shadowColor = "#ef4444";
          context.shadowBlur = 8;
        }
        for (const dx of [-eyeOffset, eyeOffset]) {
          context.beginPath();
          context.arc(HOLE.x + dx, HOLE.y - 1, 1.8, 0, Math.PI * 2);
          context.fill();
        }
        context.shadowBlur = 0;
      }

      // Flag pin — redrawn each frame over the artwork's own flag, so it
      // can sink down with the ball and fade out together on a win.
      const flagBaseY = HOLE.y - 4;
      const flagDrop = sunk.current ? sinkProgress * 24 : 0;
      const flagOpacity = sunk.current ? 1 - sinkProgress : 1;
      context.save();
      context.globalAlpha = flagOpacity;
      context.strokeStyle = "#e8eef5";
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(HOLE.x, flagBaseY + flagDrop);
      context.lineTo(HOLE.x, flagBaseY - 18 + flagDrop);
      context.stroke();
      context.beginPath();
      context.moveTo(HOLE.x, flagBaseY - 18 + flagDrop);
      context.lineTo(HOLE.x + 10, flagBaseY - 14 + flagDrop);
      context.lineTo(HOLE.x, flagBaseY - 10 + flagDrop);
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

      // Ball — drops into the hole and fades out with the flag on a win.
      const b = ball.current;
      if (sinkProgress < 1) {
        context.save();
        context.globalAlpha = sunk.current ? 1 - sinkProgress * 0.7 : 1;
        const dropY = sunk.current ? b.y + sinkProgress * 8 : b.y;
        const gradient = context.createRadialGradient(
          b.x - 3, dropY - 3, 1,
          b.x, dropY, BALL_RADIUS
        );
        gradient.addColorStop(0, "#fca5a5");
        gradient.addColorStop(1, "#b91c1c");
        context.beginPath();
        context.arc(b.x, dropY, BALL_RADIUS, 0, Math.PI * 2);
        context.fillStyle = gradient;
        context.shadowColor = "#000";
        context.shadowBlur = 4;
        context.fill();
        context.restore();
      }
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
