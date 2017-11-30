// CS207 Lab Test Template 3
// Name: Peizhi Han
// Student Number: 200336343

#include <EEPROM.h>

int val;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);

  EEPROM.put(0, 1); // 0 2 4 can not save as 0 1 2 for int
  EEPROM.get(0, val);
  Serial.println(val);


  EEPROM.put(0, 2); // 0 2 4 can not save as 0 1 2 for int
  EEPROM.get(0, val);
  Serial.println(val);

  
  EEPROM.put(0, 3); // 0 2 4 can not save as 0 1 2 for int
  EEPROM.get(0, val);
  Serial.println(val);
}

void loop() {
  // put your main code here, to run repeatedly:

}
