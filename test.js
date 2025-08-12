// save as leg_test.js
const i2c = require("i2c-bus");
const { Pca9685Driver } = require("pca9685");
// ===== CONFIG =====
const HIP_SERVO = 0; // PCA9685 channel for servo 0
const KNEE_SERVO = 1; // PCA9685 channel for servo 1
// Pulse mapping (adjust these to match your servos)
const SERVO0_CENTER = 1500; // µs
const SERVO1_CENTER = 1500; // µs
const SERVO_SCALE = 500 / 90; // µs per degree (example -> ±90° maps to 1000..2000µs)
// Test mode: "angleSquare" or "sweepMap"
const MODE = "angleSquare";
// ===================
function degToPulse(center, deg) {
  return Math.round(center + deg * SERVO_SCALE);
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
const options = {
  i2c: i2c.openSync(1),
  address: 0x40,
  frequency: 50,
  debug: false,
};
const pwm = new Pca9685Driver(options, async (err) => {
  if (err) {
    console.error("Error initializing PCA9685:", err);
    process.exit(1);
  }
  console.log("PCA9685 ready — running mode:", MODE);
  try {
    if (MODE === "angleSquare") {
      // Four corner angles in degrees [hipDeg, kneeDeg]
      const square = [
        [-30, -20],
        [30, -20],
        [30, 20],
        [-30, 20],
      ];
      // loop through square repeatedly for 20s
      const start = Date.now();
      let idx = 0;
      while (Date.now() - start < 20000) {
        const [hipDeg, kneeDeg] = square[idx];
        const hipPulse = degToPulse(SERVO0_CENTER, hipDeg);
        const kneePulse = degToPulse(SERVO1_CENTER, kneeDeg);
        pwm.setPulseLength(HIP_SERVO, hipPulse);
        pwm.setPulseLength(KNEE_SERVO, kneePulse);
        console.log(
          `corner ${idx}: hip ${hipDeg}° -> ${hipPulse}µs, knee ${kneeDeg}° -> ${kneePulse}µs`
        );
        idx = (idx + 1) % square.length;
        await sleep(900); // ~1s per corner
      }
    } else if (MODE === "sweepMap") {
      // Sweep hip then knee to observe workspace
      const hipRange = { from: -60, to: 60, step: 10 };
      const kneeRange = { from: -60, to: 60, step: 10 };
      for (let h = hipRange.from; h <= hipRange.to; h += hipRange.step) {
        for (let k = kneeRange.from; k <= kneeRange.to; k += kneeRange.step) {
          const hipPulse = degToPulse(SERVO0_CENTER, h);
          const kneePulse = degToPulse(SERVO1_CENTER, k);
          pwm.setPulseLength(HIP_SERVO, hipPulse);
          pwm.setPulseLength(KNEE_SERVO, kneePulse);
          console.log(
            `hip ${h}°, knee ${k}° → pulses ${hipPulse} / ${kneePulse}`
          );
          await sleep(250); // pause so you can watch or capture camera/frame
        }
      }
    } else {
      console.error("Unknown MODE:", MODE);
    }
  } catch (e) {
    console.error("Test aborted:", e);
  } finally {
    // neutral/stop
    pwm.setPulseLength(HIP_SERVO, 0);
    pwm.setPulseLength(KNEE_SERVO, 0);
    pwm.dispose();
    console.log("Done.");
    process.exit(0);
  }
});
