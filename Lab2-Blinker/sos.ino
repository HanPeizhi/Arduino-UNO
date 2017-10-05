/*
  Program name: Blink
  Description: 
      making a message with SOS by Morse Code
      using the pin 10 for this exercise

  
  modified 28 SEPT 2017
  by Han

  This example code is in the public domain.

*/

int led = 10;  //pin10 to get 5V
int uTime = 240; //this is 1 units of time


// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(led, OUTPUT);
}

// the loop function runs over and over again forever
void loop() {
  // S
  digitalWrite(led, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(uTime);                       // wait for a second
  digitalWrite(led, LOW);    // turn the LED off by making the voltage LOW
  delay(uTime);    // wait for a second
  digitalWrite(led, HIGH);
  delay(uTime);
  digitalWrite(led, LOW);
  delay(uTime);
  digitalWrite(led, HIGH);
  delay(uTime);
  digitalWrite(led, LOW);
  delay(uTime*3);         //Pause between Letters
                          //3 units of time
  
  // O
  digitalWrite(led, HIGH);
  delay(uTime*3);
  digitalWrite(led, LOW);
  delay(uTime);
  digitalWrite(led, HIGH);
  delay(uTime*3);
  digitalWrite(led, LOW);
  delay(uTime);
  digitalWrite(led, HIGH);
  delay(uTime*3);
  digitalWrite(led, LOW);
  delay(uTime*3);         //Pause between Letters using 3 units of time
  
  // S
  digitalWrite(led, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(uTime);                       // wait for a second
  digitalWrite(led, LOW);    // turn the LED off by making the voltage LOW
  delay(uTime);              // wait for a second
  digitalWrite(led, HIGH);
  delay(uTime);
  digitalWrite(led, LOW);
  delay(uTime);
  digitalWrite(led, HIGH);
  delay(uTime);
  digitalWrite(led, LOW);
  delay(uTime*7);             // Pause between Words
  
  

}

