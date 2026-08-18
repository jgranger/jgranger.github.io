import { simulateShot, ballFits, TEE, HOLE, WIDTH, HEIGHT, MAX_PULL } from "./golf-sim.mjs";

let failures = 0;

// Test 1: BFS reachability using the ball's actual collision footprint
// (ballFits, not a bare point) — confirms the mask has a genuine,
// ball-sized-clearance path from the tee to the hole. This is the
// regression test for the mask itself: a bad hand-drawn map, a noise
// blob from JPEG compression, or over-aggressive erosion baked into the
// mask would all show up here as an unreachable hole, without needing to
// find the exact bounce sequence a real shot would take to get there.
//
// Deliberately NOT testing "some single straight shot sinks it directly"
// — the course has a genuine dogleg corridor partway to the hole; no
// straight shot threads it, and that's correct, realistic course design,
// not a bug. Reaching the hole for real takes a bank shot or two, which
// was confirmed manually via simulateShot chains when this mask was built.
console.log("=== BFS reachability (ball-fits) from TEE to HOLE ===");
const start = [Math.round(TEE.x), Math.round(TEE.y)];
const seen = new Set([`${start[0]},${start[1]}`]);
const queue = [start];
let head = 0;
while (head < queue.length) {
  const [x, y] = queue[head++];
  for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) {
    const nx = x + dx, ny = y + dy;
    const key = `${nx},${ny}`;
    if (!seen.has(key) && ballFits(nx, ny)) {
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
}
const holeReachable = queue.some(([x, y]) => Math.hypot(x - HOLE.x, y - HOLE.y) < 15);
console.log(`  reachable cells: ${queue.length}, hole reachable: ${holeReachable}`);
if (!holeReachable) {
  console.log("  FAIL: no ball-sized path from tee to hole exists in the mask");
  failures++;
} else {
  console.log("  PASS");
}

// Test 2: fuzz a wide spread of angles/powers from the tee and confirm the
// ball never escapes the canvas bounds, regardless of where it ends up.
console.log("\n=== Fuzz: random angles/powers from the tee ===");
let fuzzOOB = 0;
const FUZZ_N = 300;
for (let i = 0; i < FUZZ_N; i++) {
  const angle = (i / FUZZ_N) * Math.PI * 2;
  const powerFrac = 0.4 + 0.6 * ((i * 37) % 100) / 100;
  const pull = MAX_PULL * powerFrac;
  const dragPoint = { x: TEE.x + Math.cos(angle) * pull, y: TEE.y + Math.sin(angle) * pull };
  const result = simulateShot(TEE, dragPoint);
  if (result.wentOutOfBounds) {
    fuzzOOB++;
    console.log(`  OOB at angle=${angle.toFixed(2)} power=${powerFrac.toFixed(2)} bbox=`, result.bbox);
  }
}
console.log(`  ${FUZZ_N - fuzzOOB}/${FUZZ_N} shots stayed in bounds`);
if (fuzzOOB > 0) failures += fuzzOOB;

// Test 3: fuzz from many random starting positions across the whole canvas
// (simulating the ball already being in play from a previous shot), same
// bounds check — catches escape routes not reachable in one shot from tee.
console.log("\n=== Fuzz: random start positions across the canvas ===");
let fuzz2OOB = 0;
const FUZZ2_N = 400;
for (let i = 0; i < FUZZ2_N; i++) {
  const start2 = { x: (i * 53) % WIDTH, y: (i * 29) % HEIGHT };
  const angle = (i * 2.399963);
  const powerFrac = 0.3 + 0.7 * ((i * 17) % 100) / 100;
  const pull = MAX_PULL * powerFrac;
  const dragPoint = { x: start2.x + Math.cos(angle) * pull, y: start2.y + Math.sin(angle) * pull };
  const result = simulateShot(start2, dragPoint);
  if (result.wentOutOfBounds) {
    fuzz2OOB++;
    console.log(`  OOB from start=(${start2.x},${start2.y}) angle=${angle.toFixed(2)} bbox=`, result.bbox);
  }
}
console.log(`  ${FUZZ2_N - fuzz2OOB}/${FUZZ2_N} shots stayed in bounds`);
if (fuzz2OOB > 0) failures += fuzz2OOB;

console.log("\n=== Summary ===");
if (failures === 0) {
  console.log("ALL TESTS PASSED");
  process.exit(0);
} else {
  console.log(`${failures} FAILURES`);
  process.exit(1);
}
