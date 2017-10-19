/*
 * Part 2:  Temperature Controlled Fan
 * Part 3: Temperature Controlled Fan (IN FREEDOM UNITS!!!)
 * 
 * 
 * Created Oct 19 2017 by Han
 */

// constants
const int motorPin = 9;
const int tempPin = A1;


// prototypes for user defined functions
void motorOnThenOff();
void motorTwoSpeed();

float AnalogToVolts(int reading);
float VoltsToCels(float volts);
float CelsToFahr(float cels);


void setup()
{
  Serial.begin(9600);
  pinMode(motorPin, OUTPUT);
  pinMode(tempPin, INPUT);
  
}

void loop()
{
  //motorOnThenOff(1000, 1000);
  //motorTwoSpeed();

  int reading;
  float volts;
  reading = analogRead(tempPin);
  volts = AnalogToVolts(reading);  //Function call
  Serial.print(volts);
  Serial.print(" ");
  
  //reading on pin A1 from volts to a temperature in degrees Celsius
  float cels;
  cels = VoltsToCels(volts); //transformation
  Serial.print(cels);
  Serial.print(" ");
  if(cels > 27)
  {
    motorOnThenOff(1000, 1000);
  }


  //convert Celsius to Fahrenheit
  float fahr = CelsToFahr(cels); //transformation
  Serial.println(fahr);
}


float AnalogToVolts(int reading)
{
  float volts;
  volts = reading/1023.0 * 5.0;  //Perform conversion
  return volts; //Return result
}

float VoltsToCels(float volts)
{
  return (volts * 100.0 - 50.0); //Return result
}

float CelsToFahr(float cels)
{
  return (cels * (9.0/5.0) + 32.0); //Return result
}

/*
 * motorOnThenOff() - turns motor on then off
 * Notice we use digital writes, 
 * just like with LEDs.
 */
void motorOnThenOff(int onTime, int offTime)
{
  //const int onTime = 2500; //the number of milliseconds for the motor to turn on for
  //const int offTime = 1000; //the number of milliseconds for the motor to turn off for

  digitalWrite(motorPin, HIGH); // turns the motor On
  delay(onTime); // waits for onTime milliseconds
  digitalWrite(motorPin, LOW); // turns the motor Off
  delay(offTime); // waits for offTime milliseconds
}

/*
 * motorTwoSpeed() - turns motor on then off but uses speed values as well
 * Notice we use analog writes to set motor speeds,
 * just like with LED brightness.
 */
void motorTwoSpeed()
{
  const int onSpeed = 200; // a number between 0 (stopped) and 255 (full speed)
  const int onTime = 1000; //the number of milliseconds for the motor to turn on for

  const int offSpeed = 27; // a number between 0 (stopped) and 255 (full speed)
  const int offTime = 2500; //the number of milliseconds for the motor to turn off for

  analogWrite(motorPin, onSpeed); // turns the motor 
  delay(onTime); // waits for onTime milliseconds
  analogWrite(motorPin, offSpeed); // turns the motor Off
  delay(offTime); // waits for offTime milliseconds
}
