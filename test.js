const i2c = require("i2c-bus");
const { Pca9685Driver } = require("pca9685");

const options = {
  i2c: i2c.openSync(1),
  address: 0x40,
  frequency: 50,
  debug: false,
};

const pwm = new Pca9685Driver(options, (err) => {
  if (err) {
    console.error("Error initializing PCA9685:", err);
    process.exit(1);
  }
  console.log("PCA9685 initialized");

  // Move all 8 servos to ~45 degrees (1250 µs pulse)
  for (let i = 0; i < 8; i++) {
    pwm.setPulseLength(i, 1250);
  }
  console.log("Moved all servos to ~45°");

  // After 2 seconds, move all 8 servos to ~120 degrees (1665 µs pulse)
  setTimeout(() => {
    for (let i = 0; i < 8; i++) {
      pwm.setPulseLength(i, 1665);
    }
    console.log("Moved all servos to ~120°");
  }, 2000);

  // After 4 seconds, stop signal and exit
  setTimeout(() => {
    for (let i = 0; i < 8; i++) {
      pwm.setPulseLength(i, 0);
    }
    pwm.dispose();
    console.log("Test complete");
    process.exit(0);
  }, 4000);
});
