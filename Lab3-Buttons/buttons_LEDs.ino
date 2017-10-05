/*
  Buttons

  Turns on and off a light emitting diode(LED) connected to digital pin 13,
  when pressing a pushbutton attached to pin 2.

  The circuit:
  - LED attached from pin 13 to ground
  - pushbutton attached to pin 2 from +5V
  - 10K resistor attached to pin 2 from ground

  - Note: on most Arduinos there is already an LED on the board
    attached to pin 13.

  created Oct 05 2017
  by Peizhi Han

*/

// constants won't change. They're used here to set pin numbers:
const int buttonPin_0 = 2;     // the number of the pushbutton pin
const int ledPin_R =  12;     // the number of the LED pin

const int buttonPin_1 = 3;
const int ledPin_G = 13;

// variables will change:
int buttonState_0 = 0;         // variable for reading the pushbutton status
int buttonState_1 = 0;

void setup() {
  
  pinMode(ledPin_R, OUTPUT);  // initialize the LED pin as an output
  pinMode(buttonPin_0, INPUT);  // initialize the pushbutton pin as an input

    
  pinMode(ledPin_G, OUTPUT);
  pinMode(buttonPin_1, INPUT);
}

void loop() {
  // read the state of the pushbutton value:
  buttonState_0 = digitalRead(buttonPin_0);
  buttonState_1 = digitalRead(buttonPin_1);  
  
  // check if the pushbutton is pressed. If it is, the buttonState is HIGH:
  if (buttonState_0 == LOW) {
    // turn LED on:
    digitalWrite(ledPin_R, HIGH);
    digitalWrite(ledPin_G, LOW);
  } 
  
  if (buttonState_1 == HIGH) {
    // turn LED on:
    digitalWrite(ledPin_R, LOW);
    digitalWrite(ledPin_G, HIGH);
  } 
  
}





