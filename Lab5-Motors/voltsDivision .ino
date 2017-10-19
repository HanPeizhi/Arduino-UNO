/* 
 * Part 1: Voltage Division
 * Using your multimeter, 
 * measure the voltage drop from the indicated points, V1 and V2, to ground
 * 
 * My measurements:
 * V1 = 4.78v
 * V2 = 0.85v
 * 
 * My calculated values:
 * V=IR I=V/R
 * 
 * I = V/R 
 *  = 5/(560 + 10000 + 2200)
 *  = 0.00039
 *  
 * V1 = I*(R2+R3)
 *  = 0.00039 * (10000+2200)
 *  = 4.758v
 * 
 * V1 = I*R3
 *  = 0.00039 * 2200
 *  = 0.858v
 *  
 *  
 * 
 * 
 * 
 * Analog to Volts Function Demo
 * Created Oct 2011 by Alex Clarke.
 * 
 * Calculated Oct 19 2017 by Han
 */


const int wl = A1;

// Function Prototype
float AnalogToVolts(int reading);

void setup()
{
  Serial.begin(9600);
}

void loop()
{
  int reading;
  float volts;
  reading = analogRead(wl);
  
  volts = AnalogToVolts(reading);  //Function call

  Serial.println(volts);
}

// Function Definition
float AnalogToVolts(int reading)
{
  float volts;
  volts = reading/1023.0 * 5.0;  //Perform conversion
  return volts; //Return result
}

