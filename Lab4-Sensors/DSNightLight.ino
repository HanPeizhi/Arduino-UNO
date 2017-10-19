/*
const int tmpPin = A0;
const int ledPin = 11;

int tmp_volts;
int tmp_cels;

void setup() {
  // put your setup code here, to run once:
  pinMode(tempPin, INPUT);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  // put your main code here, to run repeatedly:

}
*/
/* 
 Playing with pots.
 Written 23 Aug 2011 by Alex Clarke
 */

//constants for this sketch
const int ledPin = 5;

const int potPin = 3;

// variables for this sketch
int pot_value;

void setup()
{
  pinMode(ledPin, OUTPUT);
  pinMode(potPin, INPUT);
  Serial.begin(9600);
}



void loop()
{
  //read voltage from the potentiometer
  pot_value = analogRead(potPin); //refer to light 
  
  Serial.println(pot_value);
  
  

  //Turn the LED on only if it is near the the mid-point
  if (pot_value > 800)
  {
    digitalWrite(ledPin, LOW);
  }
  else
  {
    digitalWrite(ledPin, HIGH);
  }


}
