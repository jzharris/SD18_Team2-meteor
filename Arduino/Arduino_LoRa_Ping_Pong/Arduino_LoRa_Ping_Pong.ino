/*
 *  simple ping-pong test by requesting an ACK from the gateway
 *
 *  Copyright (C) 2016 Congduc Pham, University of Pau, France
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.

 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with the program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *****************************************************************************
 * last update: Jan. 19th, 2018 by C. Pham
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//>> LoRa Gateway defines
///////////////////////////////////////////////////////////////////////////////////////////////////////////
#include <SPI.h>  
// Include the SX1272
#include "SX1272.h"

// IMPORTANT
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// please uncomment only 1 choice
//
//#define ETSI_EUROPE_REGULATION
#define FCC_US_REGULATION
//#define SENEGAL_REGULATION
/////////////////////////////////////////////////////////////////////////////////////////////////////////// 

// IMPORTANT
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// uncomment if your radio is an HopeRF RFM92W, HopeRF RFM95W, Modtronix inAir9B, NiceRF1276
// or you known from the circuit diagram that output use the PABOOST line instead of the RFO line
#define PABOOST
/////////////////////////////////////////////////////////////////////////////////////////////////////////// 

// IMPORTANT
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// please uncomment only 1 choice
//#define BAND868
#define BAND900
//#define BAND433
///////////////////////////////////////////////////////////////////////////////////////////////////////////

#ifdef ETSI_EUROPE_REGULATION
#define MAX_DBM 14
#elif defined SENEGAL_REGULATION
#define MAX_DBM 10
#elif defined FCC_US_REGULATION
#define MAX_DBM 14
#endif

#ifdef BAND868
#ifdef SENEGAL_REGULATION
const uint32_t DEFAULT_CHANNEL=CH_04_868;
#else
const uint32_t DEFAULT_CHANNEL=CH_10_868;
#endif
#elif defined BAND900
const uint32_t DEFAULT_CHANNEL=CH_05_900;
#elif defined BAND433
const uint32_t DEFAULT_CHANNEL=CH_00_433;
#endif

///////////////////////////////////////////////////////////////////
// CHANGE HERE THE LORA MODE, NODE ADDRESS 
#define LORAMODE  1
#define node_addr 8
//////////////////////////////////////////////////////////////////

// we wrapped Serial.println to support the Arduino Zero or M0
#if defined __SAMD21G18A__ && not defined ARDUINO_SAMD_FEATHER_M0
#define PRINTLN                   SerialUSB.println("")              
#define PRINT_CSTSTR(fmt,param)   SerialUSB.print(F(param))
#define PRINT_STR(fmt,param)      SerialUSB.print(param)
#define PRINT_VALUE(fmt,param)    SerialUSB.print(param)
#define FLUSHOUTPUT               SerialUSB.flush();
#else
#define PRINTLN                   Serial.println("")
#define PRINT_CSTSTR(fmt,param)   Serial.print(F(param))
#define PRINT_STR(fmt,param)      Serial.print(param)
#define PRINT_VALUE(fmt,param)    Serial.print(param)
#define FLUSHOUTPUT               Serial.flush();
#endif

#define DEFAULT_DEST_ADDR 1

uint8_t message[100];

int loraMode=LORAMODE;
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//<< LoRa Gateway defines
///////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//>> I2C defines
// - current message scheme: [CMD | PAYLOAD]
///////////////////////////////////////////////////////////////////////////////////////////////////////////
#include <Wire.h>
// define default type of RPi:
//#define RPI_TYPE = 0;         // 0: Server; 1: End-device

// define addresses of RPi's:
#define RPI_SERVER        0x53  // 'S' for server
//#define RPI_END_DEV 0x45      // 'E' for end-device

// define address of Arduino
#define ARDU_ADDR         0x41  // 'A' for arduino

// define the commands sent from Pi to Arduino:
#define RPI_CMD_PING      0x00  // Ping for bootup                          Payload: 0 bytes
#define RPI_CMD_SEND      0x11  // Send data to RPi                         Payload: N bytes
#define RPI_CMD_INTERR    0x22  // Send interrogation signal through LoRa   Payload: ? bytes

// define GPIO pin for RPi comms flag
#define RPI_PIN_I2C       8     // RPi flag pin
int ping_count = 0;             // Flag for pinging
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//<< I2C defines
///////////////////////////////////////////////////////////////////////////////////////////////////////////

void setup()
{
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //>> LoRa Gateway setup
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  int e;
  
  // Open serial communications and wait for port to open:
#if defined __SAMD21G18A__ && not defined ARDUINO_SAMD_FEATHER_M0 
  SerialUSB.begin(38400);
#else
  Serial.begin(38400);  
#endif 

  // Print a start message
  PRINT_CSTSTR("%s","Simple LoRa ping-pong with the gateway\n");  

#ifdef ARDUINO_AVR_PRO
  PRINT_CSTSTR("%s","Arduino Pro Mini detected\n");  
#endif
#ifdef ARDUINO_AVR_NANO
  PRINT_CSTSTR("%s","Arduino Nano detected\n");   
#endif
#ifdef ARDUINO_AVR_MINI
  PRINT_CSTSTR("%s","Arduino MINI/Nexus detected\n");  
#endif
#ifdef ARDUINO_AVR_MEGA2560
  PRINT_CSTSTR("%s","Arduino Mega2560 detected\n");  
#endif
#ifdef ARDUINO_SAM_DUE
  PRINT_CSTSTR("%s","Arduino Due detected\n");  
#endif
#ifdef __MK66FX1M0__
  PRINT_CSTSTR("%s","Teensy36 MK66FX1M0 detected\n");
#endif
#ifdef __MK64FX512__
  PRINT_CSTSTR("%s","Teensy35 MK64FX512 detected\n");
#endif
#ifdef __MK20DX256__
  PRINT_CSTSTR("%s","Teensy31/32 MK20DX256 detected\n");
#endif
#ifdef __MKL26Z64__
  PRINT_CSTSTR("%s","TeensyLC MKL26Z64 detected\n");
#endif
#if defined ARDUINO_SAMD_ZERO && not defined ARDUINO_SAMD_FEATHER_M0
  PRINT_CSTSTR("%s","Arduino M0/Zero detected\n");
#endif
#ifdef ARDUINO_AVR_FEATHER32U4 
  PRINT_CSTSTR("%s","Adafruit Feather32U4 detected\n"); 
#endif
#ifdef  ARDUINO_SAMD_FEATHER_M0
  PRINT_CSTSTR("%s","Adafruit FeatherM0 detected\n");
#endif

// See http://www.nongnu.org/avr-libc/user-manual/using_tools.html
// for the list of define from the AVR compiler

#ifdef __AVR_ATmega328P__
  PRINT_CSTSTR("%s","ATmega328P detected\n");
#endif 
#ifdef __AVR_ATmega32U4__
  PRINT_CSTSTR("%s","ATmega32U4 detected\n");
#endif 
#ifdef __AVR_ATmega2560__
  PRINT_CSTSTR("%s","ATmega2560 detected\n");
#endif 
#ifdef __SAMD21G18A__ 
  PRINT_CSTSTR("%s","SAMD21G18A ARM Cortex-M0+ detected\n");
#endif
#ifdef __SAM3X8E__ 
  PRINT_CSTSTR("%s","SAM3X8E ARM Cortex-M3 detected\n");
#endif

  // Power ON the module
  sx1272.ON();
  
  // Set transmission mode and print the result
  e = sx1272.setMode(loraMode);
  PRINT_CSTSTR("%s","Setting Mode: state ");
  PRINT_VALUE("%d", e);
  PRINTLN;

  // enable carrier sense
  sx1272._enableCarrierSense=true;
    
  // Select frequency channel
  e = sx1272.setChannel(DEFAULT_CHANNEL);
  PRINT_CSTSTR("%s","Setting Channel: state ");
  PRINT_VALUE("%d", e);
  PRINTLN;
  
  // Select amplifier line; PABOOST or RFO
#ifdef PABOOST
  sx1272._needPABOOST=true;
  // previous way for setting output power
  // powerLevel='x';
#else
  // previous way for setting output power
  // powerLevel='M';  
#endif

  // previous way for setting output power
  // e = sx1272.setPower(powerLevel); 

  e = sx1272.setPowerDBM((uint8_t)MAX_DBM); 
  PRINT_CSTSTR("%s","Setting Power: state ");
  PRINT_VALUE("%d", e);
  PRINTLN;
  
  // Set the node address and print the result
  e = sx1272.setNodeAddress(node_addr);
  PRINT_CSTSTR("%s","Setting node addr: state ");
  PRINT_VALUE("%d", e);
  PRINTLN;
  
  // Print a success message
  PRINT_CSTSTR("%s","SX1272 successfully configured\n");
  
  delay(500);
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //<< LoRa Gateway setup
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //>> I2C setup
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  Serial.print("\nInitializing I2C\n");

  pinMode(RPI_PIN_I2C, OUTPUT);           // Set pin to output
  digitalWrite(RPI_PIN_I2C, LOW);         // Init to low

  Wire.begin(ARDU_ADDR);                  // Initiate the Wire library with self-assigned address
  Wire.onReceive(receiveEvent);           // Register event

  // Ping RPi to test communications
  ping_count = 0;
  digitalWrite(RPI_PIN_I2C, HIGH);

//  Wire.beginTransmission(RPiServer);    // Begin transmission
//  Wire.write(RPI_CMD_PING);             // Send Ping command to RPi
//  Wire.write(ping_send);                // Send Ping byte to confirm
//  Wire.endTransmission();               // End transmission
//
//  Wire.requestFrom(RPiServer, 1);       // Begin read
//  int ping_receive = 0;
//  if(Wire.available()<=1) {
//    ping_receive = Wire.read();         // Read ping byte
//  }
//
//  if(ping_receive == ping_send) {       // Ping should return ping_sent
//    Serial.print("RPi exists!\n");
//  } else {
//    Serial.print("RPi not found\n");
//  }

  Serial.print("\n");
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //<< I2C setup
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  
}


void loop(void)
{
  uint8_t r_size;
  int e;

  sx1272.CarrierSense();

  sx1272.setPacketType(PKT_TYPE_DATA);

  r_size=sprintf((char*)message, "Ping");
      
  while (1) {

      PRINT_CSTSTR("%s","Sending Ping");  
      PRINTLN;
            
      e = sx1272.sendPacketTimeoutACK(DEFAULT_DEST_ADDR, message, r_size);

      // this is the no-ack version
      // e = sx1272.sendPacketTimeout(DEFAULT_DEST_ADDR, message, r_size);
            
      PRINT_CSTSTR("%s","Packet sent, state ");
      PRINT_VALUE("%d", e);
      PRINTLN;
      
      if (e==3)
          PRINT_CSTSTR("%s","No Pong from gw!");
        
      if (e==0) {
          char message[20];
          sprintf(message,"SNR at gw=%d   ", sx1272._rcv_snr_in_ack);
          PRINT_CSTSTR("%s","Pong received from gateway!");
          PRINTLN;
          PRINT_STR("%s", message);      
      }      

      PRINTLN;
      
      delay(10000);    
  }          
}

// function that executes whenever data is received from master
// this function is registered as an event, see setup()
void receiveEvent(int numBytes) {
  if(Wire.available() > 0) {
    int cmd = Wire.read();

    // parse cmd:
    switch (cmd) {
      case RPI_CMD_PING:
                                                // Ping from RPi, initiated by RPi
        Wire.beginTransmission(RPI_SERVER);     // Begin transmission to RPi
        Wire.write(RPI_CMD_PING);               // Send Ping command to RPi
        Wire.endTransmission();                 // End transmission
        
        ping_count += 1;
        digitalWrite(RPI_PIN_I2C, LOW);         // Assume request was resolved, turn off flag pin
        break;
      case RPI_CMD_SEND:
        if(ping_count == 0) {
                                                // Initial boot-up ping from RPi, initiated when Arduino boots up
          Wire.beginTransmission(RPI_SERVER);   // Begin transmission to RPi
          Wire.write(RPI_CMD_PING);             // Send Ping command to RPi
          Wire.endTransmission();               // End transmission
          
          ping_count += 1;
          digitalWrite(RPI_PIN_I2C, LOW);       // Assume request was resolved, turn off flag pin
        } else {
                                                // Send-data request from Pi, can be initiated by Arduino
          
          digitalWrite(RPI_PIN_I2C, LOW);       // Assume request was resolved, turn off flag pin
        }
        break;
      case RPI_CMD_INTERR:
                                                // Pass the interrogation signal along the network
        
        digitalWrite(RPI_PIN_I2C, LOW);         // Assume request was resolved, turn off flag pin
        break;
      default:
        Serial.print("\n I2C command from RPi not recognized.\n");
    }
    
  }
}
