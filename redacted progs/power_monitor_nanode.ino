// Home Power Monitor
// Ver. 2.0
// (c) Nov 7, 2016, Ken Muldrew
//
// *** if MQTT server goes down, power monitor needs a hard reboot
// Uses EChun 30A CTs with 10 ohm burden resistor and 8V AC transformer
// Uses arduino ADC with 2x faster clock (about 50 samples/sine wave for both V & I)
// Nanode Arduino baord

#include <avr/wdt.h>
#include <NanodeUNIO.h>
//#include <NanodeUIP.h>  // needed to get MAC address
#include <NanodeMQTT.h>

#define inPinV  A1
#define inPinI  A2
#define ADC_BITS    10    // arduino A/D
#define ADC_COUNTS  (1<<ADC_BITS)

#define mqtt_server "192.168.0.105" //default address of rasp pi MQTT hub
#define mqtt_clientname "ESP8266Client_6"
#define mqtt_user ""
#define mqtt_password ""
// "ESP8266Client_6" house/<power / apparentpower / Vrms / Irms / powerfactor>
#define realPower_topic "house/power"
//#define apparentPower_topic "house/apparentpower"
//#define Vrms_topic "house/Vrms"
//#define Irms_topic "house/Irms"
#define powerFactor_topic "house/powerfactor"
#define REPORT_INTERVAL 10 // in sec

NanodeMQTT mqtt(&uip);

// byte macaddr[]      = {  0x00, 0x04, 0xA3, 0x37, 0xB4, 0x4C }; // Set the mac address for the arduino nano mcu 
byte macaddr[]      = {  0x00, 0x04, 0xA3, 0x27, 0x77, 0x66 }; // Set the mac address for the arduino nano mcu 

// Define various ADC prescaler
//const unsigned char PS_16 = (1 << ADPS2);
//const unsigned char PS_32 = (1 << ADPS2) | (1 << ADPS0);
const unsigned char PS_64 = (1 << ADPS2) | (1 << ADPS1);
const unsigned char PS_128 = (1 << ADPS2) | (1 << ADPS1) | (1 << ADPS0);

long tstart, timer;

    //Useful value variables
    double realPower,
      apparentPower,
      powerFactor,
      Vrms,
      Irms;
      
    //Calibration coefficients
    //These need to be set in order to obtain accurate results
    double VCAL = 98.98; // Fluke 117 voltage reading
    double ICAL = 32.83; // 32.83 from meter; 30.20  from Irms = Efergy Watts/240
//    double PHASECAL = 1.0;

    //--------------------------------------------------------------------------------------
    // Variable declaration for emon_calc procedure
    //--------------------------------------------------------------------------------------
    int sampleV;                        //sample_ holds the raw analog read value
    int sampleI;

    double lastFilteredV,filteredV;          //Filtered_ is the raw analog value minus the DC offset
    double filteredI;
    double offsetV = ADC_COUNTS>>1;          //Low-pass filter output
    double offsetI = ADC_COUNTS>>1;          //Low-pass filter output

//    double phaseShiftedV;                             //Holds the calibrated phase shifted voltage.

    double sqV,sumV,sqI,sumI,instP,sumP;              //sq = squared, sum = Sum, inst = instantaneous

    int startV;                                       //Instantaneous voltage at start of sample window.

    boolean lastVCross, checkVCross;                  //Used to measure number of times threshold is crossed.
//    boolean flipflop;

void setup() {
  realPower = 0;
  powerFactor = 0;
//  Serial.begin(9600);
//  Serial.println("ADC test");
  NanodeUNIO unio(NANODE_MAC_DEVICE);
//  unio.read(macaddr, NANODE_MAC_ADDRESS, 6);
  uip.init(macaddr);

  // FIXME: use DHCP instead
  uip.set_ip_addr(192, 168, 0, 199);
  uip.set_netmask(255, 255, 255, 0);

  uip.wait_for_link();
 // Serial.println("Link is up");

    // FIXME: resolve using DNS instead
  mqtt.set_server_addr(192, 168, 0, 105);
  mqtt.connect();

 // Serial.println("MQTT connection made");

  // set up the ADC
  ADCSRA &= ~PS_128;  // remove bits set by Arduino library

  // choose a prescaler from below.
  // PS_16, PS_32, PS_64 or PS_128
  // 1 MHz, 500 kHz, 250 kHz, 125 kHz clock rates
  
  ADCSRA |= PS_64;    // set our own prescaler to 64 

  tstart = millis();
  timer = tstart;
  wdt_enable(WDTO_8S); // refresh wdt every 10 seconds to prevent restart
}

void reconnect() {
  // Loop until we're reconnected
  while (!mqtt.connected()) {
//    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    mqtt.connect();
    // If you do not want to use a username and password, change next line to
    // if (client.connect("ESP8266Client")) {
//    if (client.connect(mqtt_clientname, mqtt_user, mqtt_password)) {
//      Serial.println("connected");
//    } else {
//      Serial.print("failed, rc=");
//      Serial.print(client.state());
 //     Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
      wdt_reset();  // if this doesn't get called every 8 seconds, reboot arduino
//    }
  }
}

void calcVI(unsigned int crossings, unsigned int timeout)
{
  int SupplyVoltage = 5192;

  unsigned int crossCount = 0;                             //Used to measure number of times threshold is crossed.
  unsigned int numberOfSamples = 0;                        //This is now incremented

  //-------------------------------------------------------------------------------------------------------------------------
  // 1) Waits for the waveform to be close to 'zero' (mid-scale adc) part in sin curve.
  //-------------------------------------------------------------------------------------------------------------------------
  boolean st=false;                                  //an indicator to exit the while loop
  
  unsigned long tstart = millis();    //millis()-start makes sure it doesnt get stuck in the loop if there is an error.

  while(st==false)                                   //the while loop...
  {
    startV = analogRead(inPinV);                    //using the voltage waveform
    if ((startV < (ADC_COUNTS*0.55)) && (startV > (ADC_COUNTS*0.45))) st=true;  //check its within range
    if ((millis()-tstart)>timeout) st = true;
  }

  //-------------------------------------------------------------------------------------------------------------------------
  // 2) Main measurement loop
  //-------------------------------------------------------------------------------------------------------------------------
  tstart = millis();

  while ((crossCount < crossings) && ((millis()-tstart)<timeout))
  {
    numberOfSamples++;                       //Count number of times looped.
    lastFilteredV = filteredV;               //Used for delay/phase compensation

    //-----------------------------------------------------------------------------
    // A) Read in raw voltage and current samples
    //-----------------------------------------------------------------------------
  //  if (flipflop) {
      sampleV = analogRead(inPinV);      //Read in raw voltage signal
      sampleI = analogRead(inPinI);                 //Read in raw current signal
 //   } else {
 //     sampleI = analogRead(inPinI);                 //Read in raw current signal
 //     sampleV = analogRead(inPinV)*2;      //Read in raw voltage signal
 //   }
//    flipflop = !flipflop; // reverse order of reading to keep in phase
    //-----------------------------------------------------------------------------
    // B) Apply digital low pass filters to extract the 2.5 V or 1.65 V dc offset,
    //     then subtract this - signal is now centred on 0 counts.
    //-----------------------------------------------------------------------------
    offsetV = offsetV + ((sampleV-offsetV)/1024);
    filteredV = (sampleV - offsetV)*2;    // measure line-neutral but need line-line
    offsetI = offsetI + ((sampleI-offsetI)/1024);
    filteredI = sampleI - offsetI;

    //-----------------------------------------------------------------------------
    // C) Root-mean-square method voltage
    //-----------------------------------------------------------------------------
    sqV= filteredV * filteredV;                 //1) square voltage values
    sumV += sqV;                                //2) sum

    //-----------------------------------------------------------------------------
    // D) Root-mean-square method current
    //-----------------------------------------------------------------------------
    sqI = filteredI * filteredI;                //1) square current values
    sumI += sqI;                                //2) sum

    //-----------------------------------------------------------------------------
    // E) Phase calibration
    //-----------------------------------------------------------------------------
 //   phaseShiftedV = lastFilteredV + PHASECAL * (filteredV - lastFilteredV);

    //-----------------------------------------------------------------------------
    // F) Instantaneous power calc
    //-----------------------------------------------------------------------------
    instP = (lastFilteredV + (filteredV - lastFilteredV)) * filteredI;          //Instantaneous Power
//    instP = phaseShiftedV * filteredI;          //Instantaneous Power
    sumP +=instP;                               //Sum

    //-----------------------------------------------------------------------------
    // G) Find the number of times the voltage has crossed the initial voltage
    //    - every 2 crosses we will have sampled 1 wavelength
    //    - so this method allows us to sample an integer number of half wavelengths which increases accuracy
    //-----------------------------------------------------------------------------
    lastVCross = checkVCross;
    if (sampleV > startV) checkVCross = true;
                     else checkVCross = false;
    if (numberOfSamples==1) lastVCross = checkVCross;

    if (lastVCross != checkVCross) crossCount++;
  }
//  timer = millis() - tstart;
//  Serial.print("time : ");
//  Serial.println(timer);
//  Serial.print("samples :");
//  Serial.println(numberOfSamples);
  //-------------------------------------------------------------------------------------------------------------------------
  // 3) Post loop calculations
  //-------------------------------------------------------------------------------------------------------------------------
  //Calculation of the root of the mean of the voltage and current squared (rms)
  //Calibration coefficients applied.

  double V_RATIO = VCAL *((SupplyVoltage/1000.0) / (ADC_COUNTS));
  Vrms = V_RATIO * sqrt(sumV / numberOfSamples);

  double I_RATIO = ICAL *((SupplyVoltage/1000.0) / (ADC_COUNTS));
  Irms = (I_RATIO * sqrt(sumI / numberOfSamples)); 

  //Calculation power values
  realPower += V_RATIO * I_RATIO * sumP / numberOfSamples;
  apparentPower = (Vrms * Irms);
  powerFactor += ((V_RATIO * I_RATIO * sumP / numberOfSamples) / apparentPower);

  //Reset accumulators
  sumV = 0;
  sumI = 0;
  sumP = 0;
//--------------------------------------------------------------------------------------
}

char *ftoa(char *a, double f, int precision) // printf float
{
 long p[] = {0,10,100,1000,10000,100000,1000000,10000000,100000000};
 
 char *ret = a;
 long heiltal = (long)f;
 itoa(heiltal, a, 10);
 while (*a != '\0') a++;
 *a++ = '.';
 long desimal = abs((long)((f - heiltal) * p[precision]));
 itoa(desimal, a, 10);
 return ret;
}

  int counter = 1;
//  double Vrms_avg = 0;
//  double Irms_avg = 0;
//  double realPower_avg = 0;
//  double apparentPower_avg = 0;
//  double powerFactor_avg = 0;

void loop() {
  char buf[10];
  
  uip.poll();
  calcVI(20,2000);          // Calculate all. No.of crossings, time-out
  counter++;
//  Vrms_avg += Vrms;
//  Irms_avg += Irms;
//  realPower_avg = realPower_avg + realPower;
//  apparentPower_avg += apparentPower;
//  powerFactor_avg = powerFactor_avg + powerFactor;
  if (millis() - timer > (REPORT_INTERVAL * 1000)) {   // report every 10s
//    realPower_avg = realPower_avg / counter;
    realPower = realPower / counter;
//    apparentPower_avg = apparentPower_avg / counter;
//    Vrms_avg = Vrms_avg / counter;
//    Irms_avg = Irms_avg / counter;
//    powerFactor_avg = powerFactor_avg / counter;
    powerFactor = powerFactor / counter;
    timer = millis();
    if (mqtt.connected()) {
//      Serial.println("Publishing...");
      ftoa(buf,realPower,1);
      mqtt.publish(realPower_topic, buf);
//      Serial.println(realPower);
 //     ftoa(buf,apparentPower_avg,1);
 //     mqtt.publish(apparentPower_topic, buf);
 //     Serial.println(apparentPower_avg);
//      ftoa(buf,Vrms_avg,1);
//      mqtt.publish(Vrms_topic, buf);
//      Serial.println(Vrms_avg);
//      ftoa(buf,Irms_avg,2);
//      mqtt.publish(Irms_topic, buf);
//      Serial.println(Irms_avg);
      ftoa(buf,powerFactor,2);
      mqtt.publish(powerFactor_topic, buf);
//      Serial.println(powerFactor);
//      Serial.println("Published.");
      counter = 1;
      realPower = 0;
      powerFactor = 0;
    } else {
      reconnect();
    }

  }
/*  Serial.print(realPower);
  Serial.print(' ');
  Serial.print(apparentPower);
  Serial.print(' ');
  Serial.print(Vrms);
  Serial.print(' ');
  Serial.print(Irms);
  Serial.print(' ');
  Serial.print(powerFactor);
  Serial.println(' '); */
  wdt_reset();  // if this doesn't get called every second, reboot arduino
}
