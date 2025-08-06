#include <Arduino.h>
#include <ESP32Servo.h>
Servo myServo1;
Servo myServo2;
void setup()
{
  Serial.begin(115200);
  delay(3000);
  myServo1.setPeriodHertz(50);
  myServo2.setPeriodHertz(50);
  myServo1.attach(2); //, 1000, 2000);
  myServo2.attach(3); //, 1000, 2000);
}
void loop()
{
  Serial.println("Moving servo to 0 degrees");
  myServo1.write(0);
  myServo2.write(0);
  delay(5000);
  Serial.println("Moving servo to 90 degrees");
  myServo1.write(90);
  myServo2.write(90);
  delay(5000);
  Serial.println("Moving servo to 180 degrees");
  myServo1.write(180);
  myServo2.write(180);
  delay(5000);
}