"use client";

import { useEffect, useRef } from "react";

// Canvas resolution matches the background art's aspect ratio
// (1681x467) so drawImage never distorts it.
const SOURCE_WIDTH = 1681;
const WIDTH = 1000;
const HEIGHT = 278;
const SCALE = WIDTH / SOURCE_WIDTH;

function scaled(x: number, y: number): { x: number; y: number } {
  return { x: x * SCALE, y: y * SCALE };
}

const BALL_RADIUS = 9;
// Used for wall/obstacle collision instead of the ball's full visual
// radius — using BALL_RADIUS there stacks up to a keep-out margin wide
// enough that the ball visibly can't approach anything closely,
// especially bad right at the hole. A smaller collision margin lets it
// nestle much closer to walls and obstacles, at the cost of a few
// pixels of visual overlap when actually touching one.
const COLLISION_MARGIN = 3;
const HOLE_CAPTURE_RADIUS = 10;
const MAX_SINK_SPEED = 7;
const FRICTION = 0.985;
const REST_SPEED = 0.1;
const MAX_PULL = 217;
const LAUNCH_POWER = 0.11;
const BOUNCE_DAMPING = 0.72;

// The hole's eyes are white by default and pulse red on a fixed cycle —
// like the mouse hole's eyes in Zany Golf — and the ball only sinks
// while they're red. Arriving too fast, or while they're white, bounces
// the ball off instead of sinking.
const HOLE_BLINK_PERIOD_MS = 1800;
const HOLE_LIT_DURATION_MS = 500;
const SINK_ANIMATION_MS = 800;
const EXPLODE_ANIMATION_MS = 550;

// Pixel positions below are all given in the SOURCE image's native
// 1681x467 resolution, matching what was measured directly against the
// artwork with debug markers before committing, then scaled down to
// canvas resolution at load time. public/golf-course-default.jpg (the
// beam-off background actually rendered) was aligned to this exact
// same 1681x467 frame via a two-point affine fit against the original
// reference image, so every position below still applies unchanged.
const TEE = scaled(265, 295);
// The goal is the actual mouse hole (a rounded archway opening in the
// wall, confirmed by close inspection of the artwork) — not the
// flag/pin marker elsewhere in the scene, which is just decoration.
// Position extracted directly from Jon's hand-marked map (a magenta
// dot at its exact center), not estimated from a crop.
const HOLE = scaled(1413.5, 294);

// Every wall, wall-shaped obstacle, and the pit boundary used to be a
// hand-approximated list of rects/circles/segments — a whole class of
// bugs ("the shape doesn't match the art") kept recurring because none
// of those shapes were ever traced precisely. Jon hand-drew the actual
// solid/floor boundary directly over the artwork (green = walls/solid,
// orange = energy-wall hazard, both treated as solid for now), which
// was flood-filled from the tee into a pixel-accurate walkable-area
// mask (see scripts/build-collision-mask.py) — public/collision-mask.png,
// sampled at runtime instead of approximated in code. Only the small
// purple-orb pedestals (never traced by Jon, deliberately left to be
// found programmatically, same color-clustering approach as before)
// remain as circle obstacles layered on top of the mask.
const MASK_WIDTH = WIDTH;
const MASK_HEIGHT = HEIGHT;

interface CircleObstacle {
  x: number;
  y: number;
  r: number;
}

function circleObstacle(x: number, y: number, r: number): CircleObstacle {
  const p = scaled(x, y);
  return { x: p.x, y: p.y, r: r * SCALE };
}

// Orb pedestals (color-clustered centers, ~16px radius each) — the one
// piece of the map still handled the same way as before, per Jon's
// request.
const ORB_OBSTACLES: CircleObstacle[] = [
  circleObstacle(428, 210, 16),
  circleObstacle(662, 248, 16),
  circleObstacle(881, 243, 16),
  circleObstacle(757, 322, 16),
  circleObstacle(935, 355, 16),
  circleObstacle(297, 370, 16),
  circleObstacle(1129, 65, 16),
  circleObstacle(1264, 103, 16),
  circleObstacle(1356, 356, 16),
  circleObstacle(1265, 391, 16),
];

// Turret beam — hidden by default, animates a bright pulse across this
// path every few seconds, and destroys the ball if it's in the way
// while firing.
const BEAM_START = scaled(850, 395);
const BEAM_END = scaled(1255, 240);
const BEAM_PULSE_PERIOD_MS = 4200;
const BEAM_PULSE_DURATION_MS = 500;
const BEAM_HAZARD_THRESHOLD = 0.55;
const BEAM_HIT_RADIUS = 10 * SCALE;

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function pointSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { dist: number; cx: number; cy: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return { dist: Math.hypot(px - cx, py - cy), cx, cy };
}

export function GolfGame({ onWin }: { onWin: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ball = useRef<BallState>({ x: TEE.x, y: TEE.y, vx: 0, vy: 0 });
  const dragging = useRef(false);
  const dragPoint = useRef({ x: TEE.x, y: TEE.y });
  const sunk = useRef(false);
  const sunkAt = useRef(0);
  const exploded = useRef(false);
  const explodedAt = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context2d = canvas.getContext("2d");
    if (!context2d) return;
    const ctx: CanvasRenderingContext2D = context2d;

    const bg = new Image();
    bg.src = "/golf-course-default.jpg";

    // The collision mask: white = walkable floor, black = solid (wall,
    // obstacle footprint, or outside the room). Loaded once, decoded to
    // an offscreen canvas, then sampled directly at runtime — no drawImage
    // of it, it's never rendered, only read.
    const maskImage = new Image();
    maskImage.src = "/collision-mask.png";
    let maskData: ImageData | null = null;
    maskImage.onload = () => {
      const off = document.createElement("canvas");
      off.width = MASK_WIDTH;
      off.height = MASK_HEIGHT;
      const offCtx = off.getContext("2d");
      if (!offCtx) return;
      offCtx.drawImage(maskImage, 0, 0, MASK_WIDTH, MASK_HEIGHT);
      maskData = offCtx.getImageData(0, 0, MASK_WIDTH, MASK_HEIGHT);
    };

    function isWalkable(x: number, y: number): boolean {
      if (!maskData) return true; // mask not loaded yet — don't block movement
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= MASK_WIDTH || py < 0 || py >= MASK_HEIGHT) return false;
      const i = (py * MASK_WIDTH + px) * 4;
      return maskData.data[i] > 128; // red channel: 255 = floor, 0 = solid
    }

    // The ball is a circle, not a point — sample a ring of points at its
    // radius (plus a small margin) in addition to the center, so it can't
    // clip its edge through a wall that its center hasn't reached yet.
    const SAMPLE_ANGLES = 8;
    function ballFits(x: number, y: number): boolean {
      if (!isWalkable(x, y)) return false;
      const r = BALL_RADIUS + COLLISION_MARGIN;
      for (let i = 0; i < SAMPLE_ANGLES; i++) {
        const a = (i / SAMPLE_ANGLES) * Math.PI * 2;
        if (!isWalkable(x + Math.cos(a) * r, y + Math.sin(a) * r)) return false;
      }
      return true;
    }

    let frame: number;
    const startTime = performance.now();

    function isHoleLit(now: number): boolean {
      return ((now - startTime) % HOLE_BLINK_PERIOD_MS) < HOLE_LIT_DURATION_MS;
    }

    function beamPulseStrength(now: number): number {
      const t = (now - startTime) % BEAM_PULSE_PERIOD_MS;
      if (t > BEAM_PULSE_DURATION_MS) return 0;
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

    function resetBall() {
      ball.current = { x: TEE.x, y: TEE.y, vx: 0, vy: 0 };
    }

    function handlePointerDown(event: PointerEvent) {
      if (sunk.current || exploded.current || !isResting()) return;
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

    function resolveCircle(b: BallState, cx: number, cy: number, r: number) {
      const dx = b.x - cx;
      const dy = b.y - cy;
      const dist = Math.hypot(dx, dy);
      const minDist = r + COLLISION_MARGIN;
      if (dist < minDist) {
        const nx = dist > 0.001 ? dx / dist : 1;
        const ny = dist > 0.001 ? dy / dist : 0;
        b.x = cx + nx * minDist;
        b.y = cy + ny * minDist;
        const dot = b.vx * nx + b.vy * ny;
        if (dot < 0) {
          b.vx -= 2 * dot * nx * BOUNCE_DAMPING;
          b.vy -= 2 * dot * ny * BOUNCE_DAMPING;
        }
      }
    }

    // Mask-based wall collision, axis-separated: try moving X and Y
    // independently, and revert+bounce whichever axis actually caused the
    // ball to enter solid ground. This is the standard technique for
    // colliding a circle against an arbitrary pixel mask — it naturally
    // handles the mask's real shape (every jog and notch in the traced
    // artwork) instead of approximating it with a handful of rects and
    // segments, which is what kept leaving gaps and mismatches before.
    function resolveMask(b: BallState, prevX: number, prevY: number) {
      const movedX = b.x !== prevX;
      const movedY = b.y !== prevY;

      if (movedX && !ballFits(b.x, prevY)) {
        b.x = prevX;
        b.vx *= -BOUNCE_DAMPING;
      }
      if (movedY && !ballFits(b.x, b.y)) {
        b.y = prevY;
        b.vy *= -BOUNCE_DAMPING;
      }
    }

    function triggerExplosion(now: number) {
      exploded.current = true;
      explodedAt.current = now;
      ball.current.vx = 0;
      ball.current.vy = 0;
      setTimeout(() => {
        resetBall();
        exploded.current = false;
      }, EXPLODE_ANIMATION_MS + 150);
    }

    function step() {
      const b = ball.current;
      const now = performance.now();
      const lit = isHoleLit(now);
      const pulse = beamPulseStrength(now);

      if (!sunk.current && !exploded.current && !dragging.current) {
        // Sub-step the movement: at max power the ball can travel ~24px
        // in one frame, more than twice its own radius — fast enough to
        // tunnel straight through a thin wall between one frame's
        // position and the next, before any distance check ever runs
        // close enough to catch it. Moving in smaller increments (each
        // no larger than the ball's radius) and resolving collisions
        // after every increment closes that gap.
        const stepDist = Math.hypot(b.vx, b.vy);
        const substeps = Math.max(1, Math.ceil(stepDist / COLLISION_MARGIN));
        for (let i = 0; i < substeps && !sunk.current && !exploded.current; i++) {
          const prevX = b.x;
          const prevY = b.y;
          b.x += b.vx / substeps;
          b.y += b.vy / substeps;

          resolveMask(b, prevX, prevY);
          for (const orb of ORB_OBSTACLES) {
            resolveCircle(b, orb.x, orb.y, orb.r);
          }

          // Checked after every sub-step, not once per frame: at speed,
          // the ball can cross clean through the whole capture zone
          // within a single frame's substeps and never register if this
          // only ran after the full movement — "a perfect shot went
          // right through it" was exactly that.
          const distToHole = Math.hypot(b.x - HOLE.x, b.y - HOLE.y);
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
          }
        }
        b.vx *= FRICTION;
        b.vy *= FRICTION;

        // Defensive recovery: if the ball ever ends up somewhere
        // impossible (NaN from a degenerate collision, or genuinely off
        // the playable area despite the above), reset rather than
        // leaving the game permanently stuck.
        const outOfBounds =
          !Number.isFinite(b.x) || !Number.isFinite(b.y) ||
          b.x < -50 || b.x > WIDTH + 50 || b.y < -50 || b.y > HEIGHT + 50;
        if (outOfBounds) {
          resetBall();
        }

        // The beam is a hazard only while actively pulsing.
        if (pulse > BEAM_HAZARD_THRESHOLD) {
          const { dist } = pointSegmentDistance(
            b.x, b.y, BEAM_START.x, BEAM_START.y, BEAM_END.x, BEAM_END.y
          );
          if (dist < BEAM_HIT_RADIUS) {
            triggerExplosion(now);
          }
        }

        if (!exploded.current && !sunk.current && isResting()) {
          // Play continues from wherever the ball comes to rest — no
          // reset to tee on an ordinary miss. Only the laser resets it.
          b.vx = 0;
          b.vy = 0;
        }
      }

      draw(ctx, lit, now, pulse);
      frame = requestAnimationFrame(step);
    }

    function draw(
      context: CanvasRenderingContext2D,
      lit: boolean,
      now: number,
      pulse: number
    ) {
      context.clearRect(0, 0, WIDTH, HEIGHT);
      if (bg.complete && bg.naturalWidth > 0) {
        context.drawImage(bg, 0, 0, WIDTH, HEIGHT);
      } else {
        context.fillStyle = "#05070d";
        context.fillRect(0, 0, WIDTH, HEIGHT);
      }

      // The background itself has no beam baked in (golf-course-
      // default.jpg) — no masking needed. The bright pulse is the only
      // beam ever drawn, and only while actually firing.
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

      const sinkProgress = sunk.current
        ? Math.min(1, (now - sunkAt.current) / SINK_ANIMATION_MS)
        : 0;
      const explodeProgress = exploded.current
        ? Math.min(1, (now - explodedAt.current) / EXPLODE_ANIMATION_MS)
        : 0;

      if (sinkProgress < 1) {
        const eyeColor = lit ? "#ef4444" : "rgba(232, 238, 245, 0.7)";
        const eyeOffset = 4;
        context.fillStyle = eyeColor;
        if (lit) {
          context.shadowColor = "#ef4444";
          context.shadowBlur = 8;
        }
        for (const ex of [-eyeOffset, eyeOffset]) {
          context.beginPath();
          context.arc(HOLE.x + ex, HOLE.y - 1, 1.8, 0, Math.PI * 2);
          context.fill();
        }
        context.shadowBlur = 0;
      }

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

      const b = ball.current;
      if (exploded.current && explodeProgress < 1) {
        // A quick expanding/fading burst instead of the ball.
        context.save();
        context.globalAlpha = 1 - explodeProgress;
        const burstR = BALL_RADIUS + explodeProgress * 22;
        const grad = context.createRadialGradient(b.x, b.y, 0, b.x, b.y, burstR);
        grad.addColorStop(0, "#fde68a");
        grad.addColorStop(0.5, "#fb923c");
        grad.addColorStop(1, "rgba(239, 68, 68, 0)");
        context.beginPath();
        context.arc(b.x, b.y, burstR, 0, Math.PI * 2);
        context.fillStyle = grad;
        context.fill();
        context.restore();
      } else if (sinkProgress < 1 && !exploded.current) {
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
