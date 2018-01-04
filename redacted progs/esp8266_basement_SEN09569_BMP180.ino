/*
 * MQTT temperature sensor
 * Uses DS1820 (NOT DS18B20 !!!)
 * 
 * 
 * Ver. 1.0, Sep 22, 2016
 * (c) Ken Muldrew
 */

// Required libraries 
// - PubSubClient by Nick ‘O Leary

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_ADS1015.h>
//#include <DHT.h>
// Adafruit bmp180 pressure module
#include <SFE_BMP180.h>
#include <Wire.h>

#define wifi_ssid "xxxxxx"
#define wifi_password "xxxxxxxxxx"

#define mqtt_server "192.168.0.105" //default address of rasp pi MQTT hub
#define mqtt_clientname "ESP8266Client_2" // test on client 9
#define mqtt_user ""
#define mqtt_password ""

#define temperature_topic "basement/temperature"
#define pressure_topic "basement/pressure"
#define humidity_topic "basement/humidity"
#define REPORT_INTERVAL 5 // in sec
#define AVG_COUNT 30 // take average of AVG_COUNT samples

//#define DHTTYPE DHT22
//#define DHTPIN  3 // DHT22 on RX (pin 3)

#define ALTITUDE 1084.0 // Altitude of dis place here

SFE_BMP180 bmp180;

Adafruit_ADS1015 ads;     /* Use thi for the 12-bit version */

float BMP180_cal = 0.6; //cal from RTD

int adc0, humCount;
long timeout;  // timer to record values when they are not changing
boolean snapshot; // record values when snapshot is true;
unsigned long startTime;

float Temperature, newTemp, TempSum, newHum, newPress, avgHum, avgPress;

WiFiClient espClient;
PubSubClient client(espClient);
//DHT dht(DHTPIN, DHTTYPE, 11); // 11 works fine for ESP8266

void setup() {
  Serial.begin(115200);
  humCount = 0; avgHum = 0.0;
  pinMode(3,INPUT_PULLUP); // put Rx pin as input
//  dht.begin();
  Wire.begin(0, 2); // I2C on GPIO0 and GPIO2
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  bmp180.begin();
  timeout = millis();
  snapshot = false;
  ads.setGain(GAIN_ONE);        // 1x gain   +/- 4.096V  1 bit = 2mV      0.125mV
  ads.begin();
}

void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(wifi_ssid);

  WiFi.begin(wifi_ssid, wifi_password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    // If you do not want to use a username and password, change next line to
    // if (client.connect("ESP8266Client")) {
    if (client.connect(mqtt_clientname, mqtt_user, mqtt_password)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

bool checkBound(float newValue, float prevValue, float maxDiff) {
  return !isnan(newValue) &&
         (newValue < prevValue - maxDiff || newValue > prevValue + maxDiff);
}

long lastMsg = 0;
float temp = 0.0;
//float diff = 0.2; // don't report change unless greater than "diff"
float hum = 0.0;
float pressure = 0.0;
float Tdiff = 0.2;
float Hdiff = 2.0;
float Pdiff = 0.05;

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  char status;
  double T,P,p0,a;


  long now = millis();
  if (now - lastMsg > (REPORT_INTERVAL * 1000)) { // only check temperature every 2 seconds
    lastMsg = now;
    if (now - timeout > 300000) { 
      snapshot = true;  // publish reading every 5 min
      timeout = now;
    }

 //   float newTemp = dht.readTemperature(); //don't use DHT temperature
 //   float newHum = dht.readHumidity();
  adc0 = ads.readADC_SingleEnded(0);
 // float newHum = (32.597 * ((adc0 / 2048) * 4.096)) - 31.228;
  float newHum = float(adc0);
  newHum = ((newHum / 2048.0) * 4.096) * 32.597 - 31.228;
  avgHum += newHum;
  humCount++;
  if (humCount > 1000) {
    avgHum = 0.0;
    humCount = 0;
  }

  status = bmp180.startTemperature();
  if (status != 0)
  {
    // Wait for the measurement to complete:
    delay(status); // Function returns 1 if successful, 0 if failure.
    status = bmp180.getTemperature(T);
    if (status != 0)
    {
      newTemp = T+BMP180_cal;
      status = bmp180.startPressure(3);
      if (status != 0)
      {
        // Wait for the measurement to complete:
        delay(status);
        status = bmp180.getPressure(P,T);
        if (status != 0)
        {
          newPress = (bmp180.sealevel(P,ALTITUDE) / 10);
//          p0 = bmp180.sealevel(P,ALTITUDE);           
        }
        else Serial.println("error retrieving pressure measurement\n");
      }
      else Serial.println("error starting pressure measurement\n");
    }
    else Serial.println("error retrieving temperature measurement\n");
  }
  else Serial.println("error starting temperature measurement\n");

    if ((checkBound(newTemp, temp, Tdiff)) || snapshot) {
      temp = newTemp;
      Serial.print("temperature: ");
      Serial.print((newTemp),2);
      Serial.println(" deg C, ");                
      client.publish(temperature_topic, String(newTemp).c_str(), true);
    }

    if (((checkBound(newHum, hum, Hdiff)) || snapshot) && (humCount >= AVG_COUNT)) {
     hum = avgHum / humCount;
      Serial.print("New humidity:");
      Serial.println(String(hum).c_str());
      client.publish(humidity_topic, String(hum).c_str(), true);
      humCount = 0; avgHum = 0.0;
    }

    if ((checkBound(newPress, pressure, Pdiff)) || snapshot) {
     pressure = newPress;
      Serial.print("relative (sea-level) pressure: ");
      Serial.print((newPress),1);
      Serial.print(" kPa, ");
      client.publish(pressure_topic, String(newPress).c_str(), true);
    }
  } 
  if (snapshot) {snapshot = false;}
}


