//LED Pin Variables
   int ledPins[] = {2,3,4,5,6,7,8,9}; //An array to hold the pin each LED is connected to
                                      
   int pattern1[] = {HIGH,LOW,HIGH,LOW,HIGH,LOW,HIGH,LOW};
   int pattern2[] = {LOW,HIGH,LOW,HIGH,LOW,HIGH,LOW,HIGH};
   int pattern3[] = {HIGH,HIGH,LOW,LOW,LOW,LOW,HIGH,HIGH};
   int pattern4[] = {LOW,LOW,HIGH,HIGH,HIGH,HIGH,LOW,LOW};

   int delayTime = 250;
    /* setup() - this function runs once when you turn your Arduino on
    * We the three control pins to outputs
    */
   void setup()
   {
     
     //Set each pin connected to an LED to output mode (pulling high (on) or low (off)
     for(int i = 0; i < 4; i++)
     {       
         pinMode(ledPins[i],OUTPUT); 
     }                             
   }
    
    
   /*
    * loop() - this function will start after setup finishes and then repeat
    */
   void loop()                     // run over and over again
   {
    
     makePattern(ledPins, pattern1, 8, delayTime*2);
     makePattern(ledPins, pattern2, 8, delayTime);
     makePattern(ledPins, pattern3, 8, delayTime*2);
     makePattern(ledPins, pattern4, 8, delayTime);
     
     if(delayTime >50 && delayTime <=250) delayTime -=50;
   }

   /*
    * makePattern - this function has three parameters:
    *   leds[]-an array of output pins connected to LEDs
    *   pattern[]-an array containing HIGH or LOW to indicate whether an LED is on or off
    *   num-the number of LEDs
    */
   void makePattern(int leds[], int pattern[], int num, int dl)
   {
     int delayTime = 200;
     for(int i = 0; i < num; i++)
     {
       digitalWrite(leds[i], pattern[i]); 
     }
     delay(dl);
   }
