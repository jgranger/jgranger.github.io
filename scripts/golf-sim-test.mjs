import { simulateShot, TEE, HOLE, WIDTH, HEIGHT, MAX_PULL } from "./golf-sim.mjs";

let failures = 0;

// Test 1: a well-aimed shot (drag directly away from the hole, at various
// power levels) should be able to reach the hole's capture zone at a slow
// enough speed at some point.
console.log("=== Direct-aim shots at the hole ===");
const dx = TEE.x - HOLE.x, dy = TEE.y - HOLE.y;
const dist = Math.hypot(dx, dy);
const ux = dx / dist, uy = dy / dist;
let anySank = false;
for (const powerFrac of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) {
  const pull = MAX_PULL * powerFrac;
  const dragPoint = { x: TEE.x + ux * pull, y: TEE.y + uy * pull };
  const result = simulateShot(TEE, dragPoint);
  console.log(
    `  power=${powerFrac.toFixed(1)} reachedHole=${result.reachedHole} outOfBounds=${result.wentOutOfBounds} frames=${result.frames} final=(${result.finalPos.x.toFixed(1)},${result.finalPos.y.toFixed(1)})`
  );
  if (result.reachedHole) anySank = true;
  if (result.wentOutOfBounds) failures++;
}
if (!anySank) {
  console.log("  FAIL: no power level on a direct line ever reached the hole's capture zone");
  failures++;
} else {
  console.log("  PASS: at least one power level reaches the hole");
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
  const start = { x: (i * 53) % WIDTH, y: (i * 29) % HEIGHT };
  const angle = (i * 2.399963);
  const powerFrac = 0.3 + 0.7 * ((i * 17) % 100) / 100;
  const pull = MAX_PULL * powerFrac;
  const dragPoint = { x: start.x + Math.cos(angle) * pull, y: start.y + Math.sin(angle) * pull };
  const result = simulateShot(start, dragPoint);
  if (result.wentOutOfBounds) {
    fuzz2OOB++;
    console.log(`  OOB from start=(${start.x},${start.y}) angle=${angle.toFixed(2)} bbox=`, result.bbox);
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
