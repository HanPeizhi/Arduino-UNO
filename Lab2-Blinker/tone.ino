/*
  Melody
  - Plays a melody
  
  Describe:
  - using a piezo speaker to beep rather than blink.
  
  circuit:
  - 8 ohm speaker on digital pin 8
  
  created Oct. 04 2017
  by Peizhi Han
*/

//#include "pitches.h"
#define NOTE_C4  262

// notes in the melody:
#define melody NOTE_C4

int beep = 8;
int uTime = 240; //this is 1 units of time


void setup() {
 
    Serial.begin(9600); //to begin Serial Communications
    //tone(8, melody);
    Serial.println("Do!");

    //delay(200);
    // stop the tone playing:
    //noTone(8);
  //}
}

void loop() {
  mc_S();
  delay(uTime*3); //Pause between Letters
  mc_O();
  delay(uTime*3); //Pause between Letters
  mc_S();
  delay(uTime*7); //Pause between Words
}

void mc_S(){
  // no need to repeat the melody.
  // S
  Serial.println("S");
  tone(beep, melody);   // turn on pin8 to beep
  delay(uTime);                       // wait for a second
  noTone(beep);    // turn beep off at pin 8
  delay(uTime);    // wait for a second
  tone(beep, melody);
  delay(uTime);
  noTone(beep);
  delay(uTime);
  tone(beep, melody);
  delay(uTime);
  noTone(beep);
  //delay(uTime*3);         //Pause between Letters
                          //3 units of time
}

void mc_O(){
    // O
  Serial.println("O");
  tone(beep, melody);
  delay(uTime*3);
  noTone(beep);
  delay(uTime);
  tone(beep, melody);
  delay(uTime*3);
  noTone(beep);
  delay(uTime);
  tone(beep, melody);
  delay(uTime*3);
  noTone(beep);
  //delay(uTime*3);         //Pause between Letters using 3 units of time

}


