// CS207 Lab Test Template 3
// Name: Peizhi Han
// Student Number: 200336343

#include <EEPROM.h>

void updateLEDs(int value);
#include <CapSense.h>


const int data = 4;
const int latch = 7;
const int clock = 8;
const int button1 = 10;
const int button2 = 11;
const int button3 = 12;
const int slider1 = A2;
const int slider2 = A1;
const int slider3 = A0;
const int buzzer = 3;
const int LDR = A3;
const int LED1 = 5;
const int LED2 = 6;

const int cap = 9;

// Pin definitions
#define SLIDER0  0
#define SLIDER1  1
#define SLIDER2  2

// State machine values
#define SLIDER_TEST 1

//Initialize CapSense object
CapSense   cs_9_2 = CapSense(9,2);   

int numberGlyphs[] = 
{
  B11000000, //0
  B11111001, //1
  B10100100, //2
  B10110000, //3
  B10011001, //4
  B10010010, //5
  B10000010, //6
  B11111000, //7
  B10000000, //8
  B10011000, //9
  B11111111, //10 - CLEAR
};

#define button0 12
#define button1 11
#define button2 10


int buttonState0 = LOW;         // variable for reading the pushbutton status
int buttonState1 = LOW;
int buttonState2 = LOW;

int val0;
int val1;
int val2;

void setup() {

  Serial.begin(9600);
  
  // put your setup code here, to run once:
  pinMode(data, OUTPUT);
  pinMode(clock, OUTPUT);  
  pinMode(latch, OUTPUT); 


  pinMode(button0, INPUT);  // initialize the pushbutton pin as an input  
  pinMode(button1, INPUT);
  pinMode(button2, INPUT);

  pinMode(cap, INPUT);
    pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  
  digitalWrite(button0,HIGH);
  digitalWrite(button1,HIGH);
  digitalWrite(button2,HIGH);

    //Enable Serial Communication (for debugging)
  Serial.begin(9600);

  // Turn off capsense object autocalibration
  cs_9_2.set_CS_AutocaL_Millis(0xFFFFFFFF);

  if(digitalRead(cap)){
    digitalWrite(LED1, HIGH);
    digitalWrite(LED2, HIGH);
  }
  else{
  Serial.println("NOT START!");
    digitalWrite(LED1, LOW);
    digitalWrite(LED2, LOW);
  }
}

void loop() {
  // put your main code here, to run repeatedly:



  if(!digitalRead(button0)){
    buttonState0 = HIGH;
    buttonState1 = LOW;
    buttonState2 = LOW;
  }
  else if(!digitalRead(button1)){
    buttonState0 = LOW;
    buttonState1 = HIGH;
    buttonState2 = LOW;
  }
  else if(!digitalRead(button2)){
    buttonState0 = LOW;
    buttonState1 = LOW;
    buttonState2 = HIGH;
  }

  Serial.print("buttonState0:");
  Serial.println(buttonState0);

  Serial.print("buttonState1:");
  Serial.println(buttonState1);

  Serial.print("buttonState2:");
  Serial.println(buttonState2);
  Serial.println();  Serial.println();
  
 
  EEPROM.get(0, val0);
  Serial.println(val0);

  EEPROM.get(2, val1);
  Serial.println(val1);

  EEPROM.get(4, val2);
  Serial.println(val2);



  if(buttonState0 == HIGH && buttonState1 == LOW && buttonState2 == LOW){
    EEPROM.get(0, val0);
    updateLEDs(numberGlyphs[val0]);
    Serial.print("Val0:");
    Serial.println(val0);

    
    val0 = analogRead(SLIDER0);
    val0 = map(val0, 0, 1023, 0, 9);
    updateLEDs(numberGlyphs[val0]);
    EEPROM.put(0, val0);
  }
  else if(buttonState0 == LOW && buttonState1 == HIGH && buttonState2 == LOW){
    EEPROM.get(2, val1);
    updateLEDs(numberGlyphs[val0]);
    Serial.print("Val1:");
    Serial.println(val1);
    
    val1 = analogRead(SLIDER1);
    val1 = map(val0, 0, 1023, 0, 9);
    updateLEDs(numberGlyphs[val1]);
    EEPROM.put(2, val1);
  }
  else if (buttonState0 == LOW && buttonState1 == LOW && buttonState2 == HIGH){
    EEPROM.get(4, val2);
    updateLEDs(numberGlyphs[val0]);
    Serial.print("Val1:");
    Serial.println(val2);
    
    val2 = analogRead(SLIDER2);
    val2 = map(val0, 0, 1023, 0, 9);
    updateLEDs(numberGlyphs[val2]);
    EEPROM.put(4, val2);
  }

  




delay(1000);
}




void updateLEDs(int value){
  digitalWrite(latch, LOW);     //Pulls the chips latch low
  shiftOut(data, clock, MSBFIRST, value); //Shifts out the 8 bits to the shift register
  digitalWrite(latch, HIGH);   //Pulls the latch high displaying the data
}
