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
const HOLE_CAPTURE_RADIUS = 16;
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
const HOLE = scaled(1395, 150);

// The room's boundary, traced from the artwork's pipe railing — a
// closed polygon the ball bounces off of like a real wall, not the
// bare canvas edge.
// The right side (near the hole) has a genuinely intricate zigzag of
// pipe notches in the artwork — rather than risk another mismatched
// straight-line gap trying to trace every jog precisely, this cuts
// inside it conservatively (a slightly smaller play area, but reliably
// solid everywhere).
const BOUNDARY_SRC: [number, number][] = [
  [230, 95], [600, 15], [770, 15], [1300, 15], [1560, 95],
  [1580, 250], [1580, 300], [1590, 420], [90, 420], [0, 300], [0, 195],
];
const BOUNDARY = BOUNDARY_SRC.map(([x, y]) => scaled(x, y));

// The turret/beam/receiver sit in a sunken pit, not on open floor — this
// traces the pit's actual retaining wall (a real diagonal panel in the
// artwork, not a raised platform as first assumed). The hole and the
// main floor sit on the normal-elevation side of this line; the pit
// interior (where the beam travels) is on the other. Previous attempts
// modeled this area as disconnected boxes near the wrong y-position
// entirely (assumed near y=15-105; the actual wall runs through
// y=150-340) — this is why it "didn't even exist" as a barrier.
const INTERIOR_WALL_SRC: [number, number][] = [
  [1000, 150], [1100, 195], [1200, 245], [1300, 295], [1400, 340],
];
const INTERIOR_WALL = INTERIOR_WALL_SRC.map(([x, y]) => scaled(x, y));

interface CircleObstacle {
  kind: "circle";
  x: number;
  y: number;
  r: number;
}
interface RectObstacle {
  kind: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
}
type Obstacle = CircleObstacle | RectObstacle;

function circleObstacle(x: number, y: number, r: number): CircleObstacle {
  const p = scaled(x, y);
  return { kind: "circle", x: p.x, y: p.y, r: r * SCALE };
}
function rectObstacle(x: number, y: number, w: number, h: number): RectObstacle {
  const p = scaled(x, y);
  return { kind: "rect", x: p.x, y: p.y, w: w * SCALE, h: h * SCALE };
}

// Solid props traced from the artwork — the console, crates, fence
// posts, portal rings, the bench, the turret base, the beam's receiver
// drum, and every individual purple-orb pedestal pickup scattered
// across the floor. Orb positions were found by color-clustering the
// actual image pixels (sampling a confirmed orb's color, then
// flood-filling matching regions) rather than estimated by eye, since
// an earlier eyeballed pass missed most of them entirely. Approximate
// footprints, not pixel-perfect, but real enough that the ball
// actually bounces off the structure.
const OBSTACLES: Obstacle[] = [
  // Raised triangular ramp/platform — a solid block sitting above floor
  // level, not a walkway to anywhere reachable. Missed in the first
  // pass entirely (the ball rolled straight through it).
  rectObstacle(585, 5, 185, 195),
  rectObstacle(470, 95, 140, 120),
  rectObstacle(750, 55, 290, 150),
  rectObstacle(950, 200, 110, 65),
  // The back strip behind the console, and the pocket right of the
  // receiver drum near the small arch, are both raised upper-tier
  // floor with no solid prop actually sealing their front edge — the
  // ball could wander laterally into either and back out. Traced
  // directly from Jon's marked-up screenshots. Both stop well clear of
  // the hole (1395,150), which stays on the lower, reachable tier.
  rectObstacle(1030, 15, 280, 90),
  rectObstacle(1450, 230, 200, 115),
  rectObstacle(110, 145, 25, 70),
  rectObstacle(250, 145, 25, 70),
  rectObstacle(400, 335, 25, 65),
  rectObstacle(500, 325, 25, 65),
  // The raised portal ring near the tee is a solid 3D obstacle; the
  // second ring right below it is a completely flat floor decal
  // (walkable, correctly has no collider) — these were originally
  // mislocated and conflated as two solid obstacles.
  circleObstacle(165, 320, 75),
  rectObstacle(560, 330, 160, 70),
  circleObstacle(820, 405, 48),
  rectObstacle(1140, 225, 120, 75),
  rectObstacle(1390, 265, 30, 35),
  // Orb pedestals (color-clustered centers, ~16px radius each):
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

    function resolveRect(b: BallState, rx: number, ry: number, rw: number, rh: number) {
      const cx = Math.max(rx, Math.min(b.x, rx + rw));
      const cy = Math.max(ry, Math.min(b.y, ry + rh));
      const dx = b.x - cx;
      const dy = b.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < COLLISION_MARGIN) {
        const nx = dist > 0.001 ? dx / dist : 1;
        const ny = dist > 0.001 ? dy / dist : 0;
        b.x = cx + nx * COLLISION_MARGIN;
        b.y = cy + ny * COLLISION_MARGIN;
        const dot = b.vx * nx + b.vy * ny;
        if (dot < 0) {
          b.vx -= 2 * dot * nx * BOUNCE_DAMPING;
          b.vy -= 2 * dot * ny * BOUNCE_DAMPING;
        }
      }
    }

    // Boundary edges push the ball back toward the interior: since the
    // ball normally approaches from inside the polygon, the vector from
    // the closest edge point to the ball naturally points further
    // inward, which is exactly the correct push/reflect direction.
    function resolveBoundary(b: BallState) {
      for (let i = 0; i < BOUNDARY.length; i++) {
        const a = BOUNDARY[i];
        const c = BOUNDARY[(i + 1) % BOUNDARY.length];
        const { dist, cx, cy } = pointSegmentDistance(b.x, b.y, a.x, a.y, c.x, c.y);
        if (dist < COLLISION_MARGIN) {
          const nx = dist > 0.001 ? (b.x - cx) / dist : 0;
          const ny = dist > 0.001 ? (b.y - cy) / dist : 0;
          b.x = cx + nx * COLLISION_MARGIN;
          b.y = cy + ny * COLLISION_MARGIN;
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            b.vx -= 2 * dot * nx * BOUNCE_DAMPING;
            b.vy -= 2 * dot * ny * BOUNCE_DAMPING;
          }
        }
      }
    }

    // The pit's retaining wall — an open polyline (not a closed loop
    // like the boundary), pushing the ball away from whichever side it
    // approaches from. That's exactly the bidirectional behavior a real
    // wall needs: block crossing from the floor side, and equally block
    // crossing back out from the pit side.
    function resolveInteriorWall(b: BallState) {
      for (let i = 0; i < INTERIOR_WALL.length - 1; i++) {
        const a = INTERIOR_WALL[i];
        const c = INTERIOR_WALL[i + 1];
        const { dist, cx, cy } = pointSegmentDistance(b.x, b.y, a.x, a.y, c.x, c.y);
        if (dist < COLLISION_MARGIN) {
          const nx = dist > 0.001 ? (b.x - cx) / dist : 0;
          const ny = dist > 0.001 ? (b.y - cy) / dist : 0;
          b.x = cx + nx * COLLISION_MARGIN;
          b.y = cy + ny * COLLISION_MARGIN;
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            b.vx -= 2 * dot * nx * BOUNCE_DAMPING;
            b.vy -= 2 * dot * ny * BOUNCE_DAMPING;
          }
        }
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
        for (let i = 0; i < substeps; i++) {
          b.x += b.vx / substeps;
          b.y += b.vy / substeps;

          resolveBoundary(b);
          resolveInteriorWall(b);
          for (const obstacle of OBSTACLES) {
            if (obstacle.kind === "circle") {
              resolveCircle(b, obstacle.x, obstacle.y, obstacle.r);
            } else {
              resolveRect(b, obstacle.x, obstacle.y, obstacle.w, obstacle.h);
            }
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

        const distToHole = Math.hypot(b.x - HOLE.x, b.y - HOLE.y);
        // Both checks share the same radius — the sink check must get
        // first refusal exactly where the ball actually enters the hole,
        // not at some larger outer radius the ball would bounce off of
        // before ever reaching the real capture zone.
        if (!exploded.current) {
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
            // Play continues from wherever the ball comes to rest — no
            // reset to tee on an ordinary miss. Only the laser resets it.
            b.vx = 0;
            b.vy = 0;
          }
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
