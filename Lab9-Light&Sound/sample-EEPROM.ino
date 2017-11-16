#include <EEPROM.h>



void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  int val1;
  EEPROM.put(0, 10); // 0 2 4 can not save as 0 1 2 for int
  EEPROM.get(0, val1);
  Serial.println(val1);
}

void loop() {
  // put your main code here, to run repeatedly:

}
