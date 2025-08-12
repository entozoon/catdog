// leg_test_circle_maxspeed.js
const i2c = require("i2c-bus");
const { Pca9685Driver } = require("pca9685");

// ====== CONFIG ======
const HIP_SERVO = 0;
const KNEE_SERVO = 1;

const SERVO0_MIN_PULSE = 1000;
const SERVO0_MAX_PULSE = 2000;
const SERVO1_MIN_PULSE = 1000;
const SERVO1_MAX_PULSE = 2000;

const SAFETY_MARGIN_DEG = 2; // leave a little safety buffer
const ANGLE_MIN = 0 + SAFETY_MARGIN_DEG;
const ANGLE_MAX = 180 - SAFETY_MARGIN_DEG;

// Circle parameters (full swing)
const HIP_CENTER = (ANGLE_MIN + ANGLE_MAX) / 2;
const KNEE_CENTER = (ANGLE_MIN + ANGLE_MAX) / 2;
const HIP_RADIUS = (ANGLE_MAX - ANGLE_MIN) / 2; // almost full range
const KNEE_RADIUS = (ANGLE_MAX - ANGLE_MIN) / 2;

const CIRCLE_PERIOD_MS = 2000; // 2 seconds per revolution
const STEP_MS = 10;
// =====================

function degToPulse(deg, minPulse, maxPulse) {
  const clamped = Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, deg));
  return Math.round(minPulse + (clamped / 180) * (maxPulse - minPulse));
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
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
  console.log("PCA9685 ready. Drawing big fast circle...");

  try {
    const startTime = Date.now();
    const runTime = 20000; // run for 20s
    while (Date.now() - startTime < runTime) {
      const t = (Date.now() % CIRCLE_PERIOD_MS) / CIRCLE_PERIOD_MS;
      const angle = t * 2 * Math.PI;

      const hipDeg = HIP_CENTER + HIP_RADIUS * Math.cos(angle);
      const kneeDeg = KNEE_CENTER + KNEE_RADIUS * Math.sin(angle);

      pwm.setPulseLength(
        HIP_SERVO,
        degToPulse(hipDeg, SERVO0_MIN_PULSE, SERVO0_MAX_PULSE)
      );
      pwm.setPulseLength(
        KNEE_SERVO,
        degToPulse(kneeDeg, SERVO1_MIN_PULSE, SERVO1_MAX_PULSE)
      );

      await sleep(STEP_MS);
    }
  } catch (e) {
    console.error("Error during test:", e);
  } finally {
    pwm.setPulseLength(HIP_SERVO, 0);
    pwm.setPulseLength(KNEE_SERVO, 0);
    pwm.dispose();
    console.log("Circle test finished.");
    process.exit(0);
  }
});
