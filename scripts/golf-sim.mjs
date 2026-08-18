// Standalone physics simulation mirroring components/bonus/GolfGame.tsx
// exactly, so shots can be verified in Node before shipping changes.
// Keep this in sync with the component's constants/logic when either changes.

const SOURCE_WIDTH = 1681;
const WIDTH = 1000;
const HEIGHT = 278;
const SCALE = WIDTH / SOURCE_WIDTH;

function scaled(x, y) { return { x: x * SCALE, y: y * SCALE }; }

const BALL_RADIUS = 9;
const COLLISION_MARGIN = 3;
const HOLE_CAPTURE_RADIUS = 10;
const MAX_SINK_SPEED = 7;
const FRICTION = 0.985;
const REST_SPEED = 0.1;
const MAX_PULL = 217;
const LAUNCH_POWER = 0.11;
const BOUNCE_DAMPING = 0.72;

const TEE = scaled(265, 295);
const HOLE = scaled(1408, 283);

const BOUNDARY_SRC = [
  [230, 95], [600, 15], [770, 15], [1300, 15], [1560, 95],
  [1580, 250], [1580, 300], [1590, 420], [90, 420], [0, 300], [0, 195],
];
const BOUNDARY = BOUNDARY_SRC.map(([x, y]) => scaled(x, y));

const INTERIOR_WALL_SRC = [
  [1000, 150], [1100, 195], [1200, 245],
];
const INTERIOR_WALL = INTERIOR_WALL_SRC.map(([x, y]) => scaled(x, y));

function circleObstacle(x, y, r) {
  const p = scaled(x, y);
  return { kind: "circle", x: p.x, y: p.y, r: r * SCALE };
}
function rectObstacle(x, y, w, h) {
  const p = scaled(x, y);
  return { kind: "rect", x: p.x, y: p.y, w: w * SCALE, h: h * SCALE };
}

const OBSTACLES = [
  rectObstacle(585, 5, 185, 195),
  rectObstacle(470, 95, 140, 120),
  rectObstacle(750, 55, 290, 150),
  rectObstacle(950, 200, 110, 65),
  rectObstacle(1030, 15, 280, 90),
  rectObstacle(110, 145, 25, 70),
  rectObstacle(250, 145, 25, 70),
  rectObstacle(400, 335, 25, 65),
  rectObstacle(500, 325, 25, 65),
  circleObstacle(165, 320, 75),
  rectObstacle(560, 330, 160, 70),
  circleObstacle(820, 405, 48),
  rectObstacle(1140, 225, 120, 25),
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

const BEAM_START = scaled(850, 395);
const BEAM_END = scaled(1255, 240);

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
function resolveRect(b, rx, ry, rw, rh) {
  const cx = Math.max(rx, Math.min(b.x, rx + rw));
  const cy = Math.max(ry, Math.min(b.y, ry + rh));
  const dx = b.x - cx, dy = b.y - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < COLLISION_MARGIN) {
    const nx = dist > 0.001 ? dx / dist : 1;
    const ny = dist > 0.001 ? dy / dist : 0;
    b.x = cx + nx * COLLISION_MARGIN; b.y = cy + ny * COLLISION_MARGIN;
    const dot = b.vx * nx + b.vy * ny;
    if (dot < 0) { b.vx -= 2 * dot * nx * BOUNCE_DAMPING; b.vy -= 2 * dot * ny * BOUNCE_DAMPING; }
  }
}
function resolveBoundary(b) {
  for (let i = 0; i < BOUNDARY.length; i++) {
    const a = BOUNDARY[i], c = BOUNDARY[(i + 1) % BOUNDARY.length];
    const { dist, cx, cy } = pointSegmentDistance(b.x, b.y, a.x, a.y, c.x, c.y);
    if (dist < COLLISION_MARGIN) {
      const nx = dist > 0.001 ? (b.x - cx) / dist : 0;
      const ny = dist > 0.001 ? (b.y - cy) / dist : 0;
      b.x = cx + nx * COLLISION_MARGIN; b.y = cy + ny * COLLISION_MARGIN;
      const dot = b.vx * nx + b.vy * ny;
      if (dot < 0) { b.vx -= 2 * dot * nx * BOUNCE_DAMPING; b.vy -= 2 * dot * ny * BOUNCE_DAMPING; }
    }
  }
}
function resolveInteriorWall(b) {
  for (let i = 0; i < INTERIOR_WALL.length - 1; i++) {
    const a = INTERIOR_WALL[i], c = INTERIOR_WALL[i + 1];
    const { dist, cx, cy } = pointSegmentDistance(b.x, b.y, a.x, a.y, c.x, c.y);
    if (dist < COLLISION_MARGIN) {
      const nx = dist > 0.001 ? (b.x - cx) / dist : 0;
      const ny = dist > 0.001 ? (b.y - cy) / dist : 0;
      b.x = cx + nx * COLLISION_MARGIN; b.y = cy + ny * COLLISION_MARGIN;
      const dot = b.vx * nx + b.vy * ny;
      if (dot < 0) { b.vx -= 2 * dot * nx * BOUNCE_DAMPING; b.vy -= 2 * dot * ny * BOUNCE_DAMPING; }
    }
  }
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
      b.x += b.vx / substeps;
      b.y += b.vy / substeps;
      resolveBoundary(b);
      resolveInteriorWall(b);
      for (const o of OBSTACLES) {
        if (o.kind === "circle") resolveCircle(b, o.x, o.y, o.r);
        else resolveRect(b, o.x, o.y, o.w, o.h);
      }
    }
    b.vx *= FRICTION; b.vy *= FRICTION;

    minX = Math.min(minX, b.x); maxAbsX = Math.max(maxAbsX, b.x);
    minY = Math.min(minY, b.y); maxAbsY = Math.max(maxAbsY, b.y);

    if (!Number.isFinite(b.x) || !Number.isFinite(b.y) ||
        b.x < -5 || b.x > WIDTH + 5 || b.y < -5 || b.y > HEIGHT + 5) {
      wentOutOfBounds = true;
    }

    const distToHole = Math.hypot(b.x - HOLE.x, b.y - HOLE.y);
    if (distToHole < HOLE_CAPTURE_RADIUS && speed(b) < MAX_SINK_SPEED) {
      reachedHole = true;
      break;
    } else if (distToHole < HOLE_CAPTURE_RADIUS) {
      // Rim bounce, same as the real game.
      const nx = (b.x - HOLE.x) / (distToHole || 1);
      const ny = (b.y - HOLE.y) / (distToHole || 1);
      b.x = HOLE.x + nx * HOLE_CAPTURE_RADIUS;
      b.y = HOLE.y + ny * HOLE_CAPTURE_RADIUS;
      const dot = b.vx * nx + b.vy * ny;
      b.vx = (b.vx - 2 * dot * nx) * 0.7;
      b.vy = (b.vy - 2 * dot * ny) * 0.7;
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
  simulateShot, TEE, HOLE, WIDTH, HEIGHT, MAX_PULL, BEAM_START, BEAM_END,
};
