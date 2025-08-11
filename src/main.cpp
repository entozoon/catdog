#include <Arduino.h>
#include <ESP32Servo.h>
#include <math.h>

Servo servo1;
Servo servo2;

float_t time_i = 0;

const int MIN_ANGLE = 30;
const int MAX_ANGLE = 150;
const float_t PHASE_SHIFT = -M_PI / 2;

void setup()
{
  Serial.begin(115200);
  delay(3000);
  servo1.setPeriodHertz(50);
  servo2.setPeriodHertz(50);
  servo1.attach(2); //, 1000, 2000);
  servo2.attach(3); //, 1000, 2000);
}
void loop()
{
  float_t range = MAX_ANGLE - MIN_ANGLE;
  float_t center = MIN_ANGLE + range / 2;
  float_t amplitude = range / 2;

  float_t pos1 = center + sin(time_i) * amplitude;
  float_t pos2 = center + sin(time_i + PHASE_SHIFT) * amplitude;

  servo1.write(pos1);
  servo2.write(pos2);

  time_i += 0.05;

  delay(10);
}
