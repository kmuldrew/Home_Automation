/*
 * MQTT temperature sensor
 * Uses DS1820 (NOT DS18B20 !!!)
 * Only measure to 0.5'C
 * 
 * Ver. 1.0, Sep 22, 2016
 * (c) Ken Muldrew
 */

// Required libraries 
// - PubSubClient by Nick ‘O Leary

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>
// #include <DallasTemperature.h>

#define wifi_ssid "xxxx"
#define wifi_password "xxxxxxxxxx"

#define mqtt_server "192.168.0.105" //default address of rasp pi MQTT hub
#define mqtt_clientname "ESP8266Client_3"
#define mqtt_user ""
#define mqtt_password ""

#define temperature_topic "kenroom/temperature"
#define REPORT_INTERVAL 5 // in sec

#define ONE_WIRE_BUS 2  // DS18B20 on GPIO2
OneWire ds(ONE_WIRE_BUS);

float Calibration_offset = 2.9; // cal from RTD
long timeout;  // timer to record values when they are not changing
boolean snapshot; // record values when snapshot is true;

byte addr[8]; // data array for the DS1820 sensor
int lastMSB = 0; // for reading DS1820 temp sensor
int lastLSB = 0;
int HighByte, LowByte, TReading, Tc_100, Whole, Fract, SignBit;

float Temperature;

WiFiClient espClient;
PubSubClient client(espClient);

void readTemperature() {
  byte i;
  byte present = 0;
  byte data[12];
  
 // get an initial temperature reading
  if ( OneWire::crc8( addr, 7) != addr[7]) // check crc
  {
    Serial.println("CRC is not valid");
    return;
  } if ( addr[0] != 0x10) // check to make sure it's a temperature sensor
  {
    Serial.println("Sensor invalid"); // Device is not a DS18S20 family device.
    return;
  }
  //ds1820 is recognized, get the temperature
  ds.reset();
  ds.select(addr);
  ds.write(0x44,1);  // start conversion, with parasitic power on at the end

  delay(1000);     // maybe 750ms is enough, maybe not
  present = ds.reset();
  ds.select(addr);    
  ds.write(0xBE);         // Read Scratchpad on DS1820

  for ( i = 0; i < 9; i++) 
  {           // we need 9 bytes
    data[i] = ds.read();
  }
  LowByte = data[0];
  HighByte = data[1];
  TReading = (HighByte << 8) + LowByte;
  SignBit = TReading & 0x8000;  // test most sig bit
  if (SignBit) // negative
  {
    TReading = (TReading ^ 0xffff) + 1; // 2's comp
  }
  // 9 bit temperature reading
 // Temperature = TReading;
 // Temperature = Temperature / 2.0;
 // 12 bit temperature reading
  Temperature = (TReading >> 1);
  float reg1 = data[7];
  float reg2 = data[6];
  Temperature = Temperature - 0.25 + ((reg1 - reg2) / reg1);
  
  if (SignBit) { Temperature = -1 * Temperature; }
  Temperature = Temperature + Calibration_offset; // calibration from RTD
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  ds.search(addr);
  readTemperature();
  timeout = millis();
  snapshot = false;
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
float diff = 0.2; // don't report change unless greater than "diff"

void loop() {
  long now = millis();
  if (now - lastMsg > (REPORT_INTERVAL * 1000)) { // only check temperature every 2 seconds
    lastMsg = now;
    if (now - timeout > 300000) { 
      snapshot = true;  // publish reading every 5 min
      timeout = now;
    }

   if (!client.connected()) {
    reconnect();
  }
  client.loop();

   readTemperature();
   float newTemp = Temperature;

    if ((checkBound(newTemp, temp, diff)) || snapshot) {
      temp = newTemp;
      Serial.print("New temperature:");
      Serial.println(String(temp).c_str());
      client.publish(temperature_topic, String(temp).c_str(), true);
    }

  }
  if (snapshot) {snapshot = false;}
}
