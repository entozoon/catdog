// leg_test_fullrange.js
const i2c = require("i2c-bus");
const { Pca9685Driver } = require("pca9685");

// ====== CONFIG ======
const HIP_SERVO = 0; // PCA9685 channel for servo 0
const KNEE_SERVO = 1; // PCA9685 channel for servo 1

// Set these to your servo's measured pulse range (µs).
// Common values: 1000..2000. If unsure, start conservative: 1100..1900
const SERVO0_MIN_PULSE = 1000;
const SERVO0_MAX_PULSE = 2000;
const SERVO1_MIN_PULSE = 1000;
const SERVO1_MAX_PULSE = 2000;

// Safety margin (degrees) so we don't slam physical stops immediately
const SAFETY_MARGIN_DEG = 5;

// angles allowed (0..180) but trimmed by margin
const ANGLE_MIN = 0 + SAFETY_MARGIN_DEG;
const ANGLE_MAX = 180 - SAFETY_MARGIN_DEG;

// Test pattern: an "angle square" in servo-coordinate space.
// Each entry is [hipDeg, kneeDeg]. Keep values inside ANGLE_MIN..ANGLE_MAX.
const SQUARE = [
  [20, 40],
  [160, 40],
  [160, 140],
  [20, 140],
];

const STEP_MS = 15; // interpolation step (ms)
const MOVE_TIME_MS = 800; // time to move between corners (ms)
// =====================

// Map 0..180 degrees -> pulse (per-servo)
function degToPulseForServo0(deg) {
  const clamped = Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, deg));
  return Math.round(
    SERVO0_MIN_PULSE + (clamped / 180.0) * (SERVO0_MAX_PULSE - SERVO0_MIN_PULSE)
  );
}
function degToPulseForServo1(deg) {
  const clamped = Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, deg));
  return Math.round(
    SERVO1_MIN_PULSE + (clamped / 180.0) * (SERVO1_MAX_PULSE - SERVO1_MIN_PULSE)
  );
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Smoothly interpolate between two angle pairs (hipA,kneeA) -> (hipB,kneeB)
async function smoothMove(pwm, hipA, kneeA, hipB, kneeB, timeMs) {
  const steps = Math.max(2, Math.round(timeMs / STEP_MS));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const hip = hipA + (hipB - hipA) * t;
    const knee = kneeA + (kneeB - kneeA) * t;
    pwm.setPulseLength(HIP_SERVO, degToPulseForServo0(hip));
    pwm.setPulseLength(KNEE_SERVO, degToPulseForServo1(knee));
    await sleep(STEP_MS);
  }
}

const options = {
  i2c: i2c.openSync(1),
  address: 0x40,
  frequency: 50,
  debug: false,
};

const pwm = new Pca9685Driver(options, async (err) => {
  if (err) {
    console.error("PCA9685 init error:", err);
    process.exit(1);
  }
  console.log("PCA9685 ready. Running angle-square using 0..180 mapping.");
  try {
    // move to first corner instantly (safe)
    const [h0, k0] = SQUARE[0];
    pwm.setPulseLength(HIP_SERVO, degToPulseForServo0(h0));
    pwm.setPulseLength(KNEE_SERVO, degToPulseForServo1(k0));
    console.log("Starting at corner 0:", h0, k0);
    await sleep(700);

    // cycle through square corners smoothly for 20 seconds
    const stopAt = Date.now() + 20000;
    let idx = 0;
    while (Date.now() < stopAt) {
      const curr = SQUARE[idx];
      const next = SQUARE[(idx + 1) % SQUARE.length];
      console.log(
        `Corner ${idx} -> ${(idx + 1) % SQUARE.length}: `,
        curr,
        "->",
        next
      );
      await smoothMove(pwm, curr[0], curr[1], next[0], next[1], MOVE_TIME_MS);
      idx = (idx + 1) % SQUARE.length;
      await sleep(120); // small pause at each corner
    }
  } catch (e) {
    console.error("Error during test:", e);
  } finally {
    // stop signals and cleanup
    try {
      pwm.setPulseLength(HIP_SERVO, 0);
      pwm.setPulseLength(KNEE_SERVO, 0);
    } catch (e) {}
    pwm.dispose();
    console.log("Test finished. Exiting.");
    process.exit(0);
  }
});
