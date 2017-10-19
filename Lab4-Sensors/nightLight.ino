/* 
 Peizhi HAN
 200336343
 CS207 LAB4
 
 - Playing with pots.
 */

//constants for this sketch
const int ledPin = 11;
const int piezoPin = 6;
const int potPin = A0;

// variables for this sketch
int pot_value;
int frequency;

void setup()
{
  pinMode(ledPin, OUTPUT);
  pinMode(piezoPin, OUTPUT);
  Serial.begin(9600);
}



void loop()
{
  //read voltage from the potentiometer
  pot_value = analogRead(potPin);
  Serial.println(pot_value);

  //The map() function changes input values 
  //from one integer range to another
  int brightness = map(pot_value, 0, 1023, 0, 255);
  
  //Set the LED to brightness pot_value
  
  //analogWrite(ledPin, pot_value);
  analogWrite(ledPin, brightness);

  //Turn the LED on only if it is near the the mid-point
  if (pot_value < 500 || pot_value > 524)
  {
    digitalWrite(ledPin, LOW);
  }
  else
  {
    analogWrite(ledPin, HIGH);
  }

  //Play the sound represented by frequency pot_value
  tone(piezoPin, pot_value);
}
