// Sweep
// by BARRAGAN  
// This example code is in the public domain.


#include <Servo.h> 
 
Servo myservo;  // create servo object to control a servo 
                // a maximum of eight servo objects can be created 
 
int pos = 0;    // variable to store the servo position 
 int sweep=0;

void setup() 
{ 
  Serial.begin(9600);
  myservo.attach(9);  // attaches the servo on pin 9 to the servo object 
} 


void swp(int num){
   for(pos = 90 - sweep; pos < 90 + sweep; pos += 1)  // goes from 0 degrees to 180 degrees 
   {                                  // in steps of 1 degree 
     myservo.write(pos);              // tell servo to go to position in variable 'pos' 
     delay(20);                       // waits 15ms for the servo to reach the position 
   } 

    
    for(pos = 90+sweep; pos>=90-sweep-num; pos-=1)     // goes from 180 degrees to 0 degrees 
    {                                
     myservo.write(pos);              // tell servo to go to position in variable 'pos' 
     delay(20);                       // waits 15ms for the servo to reach the position 
    } 


  sweep +=num;
  Serial.println(sweep);
}

void loop() 
{ 
  //myservo.write(0); 

  
  if(sweep <=90){ 
   swp(10);
  }
  
  if(sweep >= 90){
    while(sweep != 0){
      swp(-10);
    }
  }
  
  /*
  int sweep=10;
  
  for(int i=0; i<=90; i+=10){
    for(pos = 90 - sweep; pos < 90 + sweep; pos += 1)  // goes from 0 degrees to 180 degrees 
    {                                  // in steps of 1 degree 
      myservo.write(pos);              // tell servo to go to position in variable 'pos' 
      delay(20);                       // waits 15ms for the servo to reach the position 
    } 

    
    for(pos = 90+sweep; pos>=90-sweep-10; pos-=1)     // goes from 180 degrees to 0 degrees 
    {                                
     myservo.write(pos);              // tell servo to go to position in variable 'pos' 
     delay(20);                       // waits 15ms for the servo to reach the position 
    } 

    sweep+=10;

  }  
  */
} 


