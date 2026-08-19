// Standalone physics simulation mirroring components/bonus/GolfGame.tsx
// exactly, so shots can be verified in Node before shipping changes.
// Keep this in sync with the component's constants/logic when either changes.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PNG } from "pngjs";

const SOURCE_WIDTH = 1681;
const WIDTH = 1000;
const HEIGHT = 278;
const SCALE = WIDTH / SOURCE_WIDTH;

function scaled(x, y) { return { x: x * SCALE, y: y * SCALE }; }

const BALL_RADIUS = 6;
const COLLISION_MARGIN = 2;
const HOLE_CAPTURE_RADIUS = 12;
const MAX_SINK_SPEED = 15;
const FRICTION = 0.985;
const REST_SPEED = 0.1;
const MAX_PULL = 217;
const LAUNCH_POWER = 0.11;
const BOUNCE_DAMPING = 0.72;

const TEE = scaled(265, 295);
const HOLE = scaled(1413.5, 294);

function circleObstacle(x, y, r) {
  const p = scaled(x, y);
  return { x: p.x, y: p.y, r: r * SCALE };
}

const ORB_OBSTACLES = [
  circleObstacle(428, 210, 16), circleObstacle(662, 248, 16), circleObstacle(881, 243, 16),
  circleObstacle(757, 322, 16), circleObstacle(935, 355, 16), circleObstacle(297, 370, 16),
  circleObstacle(1129, 65, 16), circleObstacle(1264, 103, 16), circleObstacle(1356, 356, 16),
  circleObstacle(1265, 391, 16),
];

const BEAM_START = scaled(850, 395);
const BEAM_END = scaled(1255, 240);

// The collision mask: white = walkable floor, black = solid. Built by
// scripts/build-collision-mask.py from Jon's hand-marked map — see that
// script for how public/collision-mask.png is generated.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MASK_PATH = path.join(__dirname, "..", "public", "collision-mask.png");
const maskPng = PNG.sync.read(readFileSync(MASK_PATH));
const MASK_WIDTH = maskPng.width;
const MASK_HEIGHT = maskPng.height;

function isWalkable(x, y) {
  const px = Math.round(x), py = Math.round(y);
  if (px < 0 || px >= MASK_WIDTH || py < 0 || py >= MASK_HEIGHT) return false;
  const i = (py * MASK_WIDTH + px) * 4;
  return maskPng.data[i] > 128;
}

// The ball is a circle, not a point — sample a ring of points at its
// radius (plus a small margin) in addition to the center, matching
// GolfGame.tsx's ballFits exactly.
const SAMPLE_ANGLES = 8;
function ballFits(x, y) {
  if (!isWalkable(x, y)) return false;
  const r = BALL_RADIUS + COLLISION_MARGIN;
  for (let i = 0; i < SAMPLE_ANGLES; i++) {
    const a = (i / SAMPLE_ANGLES) * Math.PI * 2;
    if (!isWalkable(x + Math.cos(a) * r, y + Math.sin(a) * r)) return false;
  }
  return true;
}

function pointSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return { dist: Math.hypot(px - cx, py - cy), cx, cy };
}

function resolveCircle(b, cx, cy, r) {
  const dx = b.x - cx, dy = b.y - cy;
  const dist = Math.hypot(dx, dy);
  const minDist = r + COLLISION_MARGIN;
  if (dist < minDist) {
    const nx = dist > 0.001 ? dx / dist : 1;
    const ny = dist > 0.001 ? dy / dist : 0;
    b.x = cx + nx * minDist; b.y = cy + ny * minDist;
    const dot = b.vx * nx + b.vy * ny;
    if (dot < 0) { b.vx -= 2 * dot * nx * BOUNCE_DAMPING; b.vy -= 2 * dot * ny * BOUNCE_DAMPING; }
  }
}

// Mask-based wall collision, axis-separated: try moving X and Y
// independently, and revert+bounce whichever axis actually caused the
// ball to enter solid ground. Matches GolfGame.tsx's resolveMask exactly
// — in particular, there is deliberately no third "combined point" check:
// an earlier version had one, and it fully reversed both velocity axes on
// any corner graze, turning glancing bounces into dead stops and trapping
// the ball near the tee.
function resolveMask(b, prevX, prevY) {
  const movedX = b.x !== prevX;
  const movedY = b.y !== prevY;
  if (movedX && !ballFits(b.x, prevY)) { b.x = prevX; b.vx *= -BOUNCE_DAMPING; }
  if (movedY && !ballFits(b.x, b.y)) { b.y = prevY; b.vy *= -BOUNCE_DAMPING; }
}

function speed(b) { return Math.hypot(b.vx, b.vy); }

// Simulate one shot: launch from `from`, aimed as if the player dragged to
// `dragPoint`, and run physics until it rests (or max frames). Returns the
// full trajectory plus whether it ever got within capture range at a slow
// enough speed (position/speed reachability — ignoring the hole's lit/dark
// timing, which is a separate, independently-verified mechanic).
function simulateShot(from, dragPoint, maxFrames = 2000) {
  const b = { x: from.x, y: from.y, vx: 0, vy: 0 };
  let dx = b.x - dragPoint.x, dy = b.y - dragPoint.y;
  const pull = Math.hypot(dx, dy);
  if (pull > MAX_PULL) { dx = (dx / pull) * MAX_PULL; dy = (dy / pull) * MAX_PULL; }
  b.vx = dx * LAUNCH_POWER; b.vy = dy * LAUNCH_POWER;

  let maxAbsX = b.x, minX = b.x, maxAbsY = b.y, minY = b.y;
  let reachedHole = false;
  let wentOutOfBounds = false;
  let frames = 0;

  for (; frames < maxFrames; frames++) {
    const stepDist = Math.hypot(b.vx, b.vy);
    if (stepDist < REST_SPEED) break;
    const substeps = Math.max(1, Math.ceil(stepDist / COLLISION_MARGIN));
    for (let i = 0; i < substeps; i++) {
      const prevX = b.x; const prevY = b.y;
      b.x += b.vx / substeps;
      b.y += b.vy / substeps;

      // Checked before wall/mask collision, matching the real component's
      // fix: the mouse hole is a narrow archway alcove, not open floor,
      // so it naturally fails ballFits's full-clearance ring test.
      // Resolving mask collision first would bounce the ball off the
      // alcove's walls before this distance check ever saw it, and the
      // hole could never actually be entered.
      const distToHole = Math.hypot(b.x - HOLE.x, b.y - HOLE.y);
      if (distToHole < HOLE_CAPTURE_RADIUS) {
        if (speed(b) < MAX_SINK_SPEED) {
          reachedHole = true;
          break;
        }
        const nx = (b.x - HOLE.x) / (distToHole || 1);
        const ny = (b.y - HOLE.y) / (distToHole || 1);
        b.x = HOLE.x + nx * HOLE_CAPTURE_RADIUS;
        b.y = HOLE.y + ny * HOLE_CAPTURE_RADIUS;
        const dot = b.vx * nx + b.vy * ny;
        b.vx = (b.vx - 2 * dot * nx) * 0.7;
        b.vy = (b.vy - 2 * dot * ny) * 0.7;
        continue;
      }

      resolveMask(b, prevX, prevY);
      for (const orb of ORB_OBSTACLES) resolveCircle(b, orb.x, orb.y, orb.r);
    }
    if (reachedHole) break;
    b.vx *= FRICTION; b.vy *= FRICTION;

    minX = Math.min(minX, b.x); maxAbsX = Math.max(maxAbsX, b.x);
    minY = Math.min(minY, b.y); maxAbsY = Math.max(maxAbsY, b.y);

    if (!Number.isFinite(b.x) || !Number.isFinite(b.y) ||
        b.x < -5 || b.x > WIDTH + 5 || b.y < -5 || b.y > HEIGHT + 5) {
      wentOutOfBounds = true;
    }
  }

  return {
    finalPos: { x: b.x, y: b.y },
    frames,
    reachedHole,
    wentOutOfBounds,
    bbox: { minX, maxAbsX, minY, maxAbsY },
  };
}

export {
  simulateShot, ballFits, TEE, HOLE, WIDTH, HEIGHT, MAX_PULL, BEAM_START, BEAM_END,
};
