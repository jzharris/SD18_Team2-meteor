// LoRa 9x_TX
// -*- mode: C++ -*-
// Example sketch showing how to create a simple messaging client (transmitter)
// with the RH_RF95 class. RH_RF95 class does not provide for addressing or
// reliability, so you should only use RH_RF95 if you do not need the higher
// level messaging abilities.
// It is designed to work with the other example LoRa9x_RX

#include <SPI.h>
#include <RH_RF95.h>

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
#define RPI_CMD_ACK       0x33  // Send interrogation ack                   Payload: 0 bytes
#define RPI_CMD_RECEIVE   0x44  // Receive data from RPi                    Payload: N bytes
#define RPI_CMD_DONE      0x55

// define GPIO pin for RPi comms flag
#define RPI_PIN_I2C       8     // RPi i2c flag pin
char ping_count = 0;             // Flag for pinging

#define RPI_PIN_INT       9     // RPi interrogation flag pin
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//<< I2C defines
///////////////////////////////////////////////////////////////////////////////////////////////////////////


#define RFM95_CS 10
#define RFM95_RST 3
#define RFM95_INT 2

// Change to 434.0 or other frequency, must match RX's freq!
#define RF95_FREQ 915.0

// Singleton instance of the radio driver
RH_RF95 rf95(RFM95_CS, RFM95_INT);

// Define Node Address
#define NodeAddr 1

int16_t packetnum = 0;  // packet counter, we increment per xmission
uint8_t i, node_read,count;
uint8_t cmd = -1;
uint8_t buf[251];
uint8_t len = sizeof(buf);

int z = 0;
#define TRANSMISSION_CAP  251
uint8_t transmit_string[TRANSMISSION_CAP] = "";
uint8_t c;

void setup()
{
  setup_Tx();
}

void loop(){
  Rx();
}


void setup_Tx(){
  pinMode(RFM95_RST, OUTPUT);
  digitalWrite(RFM95_RST, HIGH);

  while (!Serial);
  Serial.begin(9600);
  delay(100);

//  Serial.println("Arduino LoRa TX Test!");

  // manual reset
  digitalWrite(RFM95_RST, LOW);
  delay(10);
  digitalWrite(RFM95_RST, HIGH);
  delay(10);

  while (!rf95.init()) {
    Serial.println("LoRa radio init failed");
    while (1);
  }
//  Serial.println("LoRa radio init OK!");

  // Defaults after init are 434.0MHz, modulation GFSK_Rb250Fd250, +13dbM
  if (!rf95.setFrequency(RF95_FREQ)) {
    Serial.println("setFrequency failed");
    while (1);
  }
//  Serial.print("Set Freq to: "); Serial.println(RF95_FREQ);

  // Defaults after init are 434.0MHz, 13dBm, Bw = 125 kHz, Cr = 4/5, Sf = 128chips/symbol, CRC on

  // The default transmitter power is 13dBm, using PA_BOOST.
  // If you are using RFM95/96/97/98 modules which uses the PA_BOOST transmitter pin, then
  // you can set transmitter powers from 5 to 23 dBm:
  rf95.setTxPower(23, false);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //>> I2C setup
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Serial.print("\nInitializing I2C\n");

  pinMode(RPI_PIN_I2C, OUTPUT);           // Set pin to output
  digitalWrite(RPI_PIN_I2C, LOW);         // Init to low
  delay(100);

  Wire.begin(ARDU_ADDR);                  // Initiate the Wire library with self-assigned address
  Wire.onReceive(receiveData);            // Register receive event
  Wire.onRequest(sendData);               // Register request event
  
  ping_count = 0;

  // Set up Interrogate I/O
  pinMode(RPI_PIN_INT, OUTPUT);
  digitalWrite(RPI_PIN_INT, LOW);

  Serial.print("\n\nLoRa active!\n\n");

  reset_Buffer();
  Wire.setClock(100000);
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //<< I2C setup
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
}

void reset_Buffer() {
  for(int i = 0; i < TRANSMISSION_CAP; i++) {
    transmit_string[i] = "";
  }
  z = 0;
  transmit_string[z++] = '1';           // default gateway node: 1
  transmit_string[z++] = '_';
  transmit_string[z++] = NodeAddr + 48;
  transmit_string[z++] = '_';
}

String rec;
void receiveData(int numBytes) {
  c = 0;
  cmd = Wire.read();
  switch (cmd) {
  case RPI_CMD_INTERR:
//    Serial.println("I2C interrogation request, pass along and send acknowledge");
    Interrogate();                           // Pass the interrogation signal along the network
    break;
  case RPI_CMD_ACK:
    digitalWrite(RPI_PIN_INT, LOW);
    break;
  case RPI_CMD_RECEIVE:
    if(z == 0) {
      reset_Buffer();
    }
    while(Wire.available()){                   //Read in data to send
      c = Wire.read();
      if(c != 1) {
        if(z < TRANSMISSION_CAP) {
          transmit_string[z++] = c;
        } else {
          break;
        }
      }
    }

    if(c == 1 || z == TRANSMISSION_CAP) {
      // done!
//      Serial.print("\nTransmitting message: ");
//      Serial.println((char *)transmit_string); delay(100);

      transmit_string[0] = '1';
      transmit_string[2] = NodeAddr + 48;
      rf95.send(transmit_string, sizeof(transmit_string));
      
      reset_Buffer();
    }
    break;
  case RPI_CMD_DONE:
    digitalWrite(RPI_PIN_I2C, LOW); 
    break;
  default:
    break;
  }
}

int message_size = 0;
void sendData() {
  // parse cmd:
  switch (cmd) {
  case RPI_CMD_PING:
                                            // Ping from RPi, initiated by RPi
    Wire.write(ping_count);                 // Send self address back as pong
    digitalWrite(RPI_PIN_I2C, LOW);         // Assume request was resolved, turn off flag pin
    break;
  case RPI_CMD_SEND:
    if(z == 251+50) {
      Wire.write(0);
      digitalWrite(RPI_PIN_I2C, LOW);         // Assume request was resolved, turn off flag pin
      reset_Buffer();
    } else if (z < 50) {
      Wire.write(1);
      z++;
    } else if(z < 251+50) {
      if(message_size != 0) {
        Wire.write(message_size);
        message_size = 0;
      } else {
        Wire.write(transmit_string[z++ - 50]);  // Send-data request from Pi, can be initiated by Arduino
      }
    } else {
      Wire.write(0);
    }
    break;
  default:
    Wire.write(0);
  }
}

char ToAddr = '0';
char PrevTo = '\0';
char FromAddr = '0';
char PrevFrom = '\0';
void Rx(){
  if (rf95.available())
  {
    if (rf95.recv(buf, &len))  // Should be a reply message for us now
    {
      reset_Buffer();
      //Serial.println((char*)buf);
      strcpy(transmit_string,buf);
      char* ToAddr_str = strtok(buf, "_");
      ToAddr = atoi(strtok(buf, "_"));
      FromAddr = atoi(strtok(0,"_"));
      delay(5);

      if(ToAddr == 0) {
        // Meant for everyone - has to be interrogation signal. Interrogate and forward message along
        //Serial.println("Meant for everyone");
        digitalWrite(RPI_PIN_INT, HIGH);
        rf95.send(transmit_string, sizeof(transmit_string));
      } else if(ToAddr == NodeAddr) {
        //Serial.println("Meant for me");
        // Meant for me - could be interrogation or data
        if(transmit_string[4] == '_') {
          // interrogation
          digitalWrite(RPI_PIN_INT, HIGH);
          delay(50);
          digitalWrite(RPI_PIN_INT, LOW);
        } else {
          //Serial.println("Not meant for me");
          // data
          z = 0;
          digitalWrite(RPI_PIN_I2C, HIGH);
        }
      } else {
        // Not meant for me - propagate message if have not already done so
        if(*ToAddr_str != 's' && ToAddr != PrevTo && FromAddr != PrevFrom) {
          PrevTo = ToAddr;
          PrevFrom = FromAddr;
          rf95.send(transmit_string, sizeof(transmit_string));
        }
      }
    }
  }
  delay(1);
}

void Interrogate(){
  // Send a message to rf95_server
  //Serial.println("Interrogating");
  reset_Buffer();
  i = 0;
  
  while(Wire.available()){                   //Read in node address to interrogate
    node_read = Wire.read();
    if(node_read == 100){
      transmit_string[0] = 's';
    }
    else{
      transmit_string[0] = node_read + 48;
    }
    i++;
  }

  if (count > 3){
    delay(1000);
    count = 0;
  } else {
    delay(10);
  }
  
  transmit_string[4]='_';
  delay(10);
  rf95.send((uint8_t *)transmit_string, 5);

  count++;
}
