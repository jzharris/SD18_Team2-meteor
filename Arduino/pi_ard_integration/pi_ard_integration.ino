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

// define GPIO pin for RPi comms flag
#define RPI_PIN_I2C       8     // RPi i2c flag pin
int ping_count = 0;             // Flag for pinging

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
int i, node_read,count;
int cmd = -1;
uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];
uint8_t transmitted_data[RH_RF95_MAX_MESSAGE_LEN];
uint8_t len = sizeof(buf);

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

  Serial.println("Arduino LoRa TX Test!");

  // manual reset
  digitalWrite(RFM95_RST, LOW);
  delay(10);
  digitalWrite(RFM95_RST, HIGH);
  delay(10);

  while (!rf95.init()) {
    Serial.println("LoRa radio init failed");
    while (1);
  }
  Serial.println("LoRa radio init OK!");

  // Defaults after init are 434.0MHz, modulation GFSK_Rb250Fd250, +13dbM
  if (!rf95.setFrequency(RF95_FREQ)) {
    Serial.println("setFrequency failed");
    while (1);
  }
  Serial.print("Set Freq to: "); Serial.println(RF95_FREQ);

  // Defaults after init are 434.0MHz, 13dBm, Bw = 125 kHz, Cr = 4/5, Sf = 128chips/symbol, CRC on

  // The default transmitter power is 13dBm, using PA_BOOST.
  // If you are using RFM95/96/97/98 modules which uses the PA_BOOST transmitter pin, then
  // you can set transmitter powers from 5 to 23 dBm:
  rf95.setTxPower(23, false);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //>> I2C setup
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  Serial.print("\nInitializing I2C\n");

  pinMode(RPI_PIN_I2C, OUTPUT);           // Set pin to output
  digitalWrite(RPI_PIN_I2C, LOW);         // Init to low
  delay(100);

  Wire.begin(ARDU_ADDR);                  // Initiate the Wire library with self-assigned address
  Wire.onReceive(receiveData);            // Register receive event
  Wire.onRequest(sendData);               // Register request event

  // Ping RPi to test communications
  ping_count = 0;
  digitalWrite(RPI_PIN_I2C, HIGH);

  // Set up Interrogate I/O
  pinMode(RPI_PIN_INT, OUTPUT);
  digitalWrite(RPI_PIN_INT, LOW);

  Serial.print("done!\n\n");
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //<< I2C setup
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

}

String rec;
void receiveData(int numBytes) {
  if(Wire.available() > 0) {
    cmd = Wire.read();
    switch (cmd) {
    case RPI_CMD_INTERR:
      Serial.println("I2C interrogation request, pass along and send acknowledge");
      Interrogate();                           // Pass the interrogation signal along the network
      break;
    case RPI_CMD_ACK:
      Serial.println("interrogation signal has been delivered to RPi");
      digitalWrite(RPI_PIN_INT, LOW);
      break;
    case RPI_CMD_RECEIVE:
      Serial.println("I2C receive request from RPi, receiving data");

      char receive_string[80] = "";
      while(Wire.available()){                   //Read in node address to interrogate
        char c = Wire.read();
        Serial.print(c);
        Serial.println("");
        strcat(receive_string, c);
      }
      
      Serial.println("---");
      Serial.print("Transmitting message: ");
      Serial.println(rec);
      Serial.println("---");
      
      strcat(receive_string,"_");                       //Parse between node to and from address
      itoa(NodeAddr,transmit_string + i + 1,10);                 
      strcat(receive_string,"_Transmit");
      Serial.print("Message to be sent:");
      Serial.println(receive_string); delay(100);
      Serial.println("Currently Transmitting"); delay(100);
      rf95.send((uint8_t *)receive_string, sizeof(receive_string));
      break;
    default:
      break;
    }
  }
}

void sendData() {
  // parse cmd:
  switch (cmd) {
  case RPI_CMD_PING:
                                            // Ping from RPi, initiated by RPi
    Wire.write(1);
    Wire.write(ping_count);                 // Send self address back as pong
     
    digitalWrite(RPI_PIN_I2C, LOW);         // Assume request was resolved, turn off flag pin
    break;
  case RPI_CMD_SEND:
    Serial.println("I2C send request from RPi, sending data");
    //Might need RPi delay inbetween command and sending data
    Wire.write(sizeof(transmitted_data));
    Wire.write(transmitted_data,sizeof(transmitted_data));           // Send-data request from Pi, can be initiated by Arduino
    
    digitalWrite(RPI_PIN_I2C, LOW);         // Assume request was resolved, turn off flag pin
    break;
  default:
    Serial.println("I2C command from RPi not recognized...\n");
    Serial.println(cmd);
  }
}

void Rx(){
  if (rf95.available())
  {
    if (rf95.recv(buf, &len))  // Should be a reply message for us now
    { 
      Serial.print("Got reply: ");
      Serial.println((char*)buf);
      strcpy(transmitted_data,buf);
      char* ToAddr_str = strtok(buf, "_");
      char* FromAddr_str =strtok(0,"_");
      int ToAddr = atoi(strtok(buf, "_"));
      int FromAddr = atoi(strtok(0,"_"));
      delay(30);
      
      if(ToAddr == NodeAddr || ToAddr == 0){
        Serial.println("Received Response Correctly");
        Serial.print("Message was sent by Node ");
        Serial.println(FromAddr);
        Serial.print("Message was intended for me: ");
        Serial.println(ToAddr);

        // Send interrogation signal to RPi
        digitalWrite(RPI_PIN_INT, HIGH);
      }
      else {
        Serial.println("This message wasn't meant for me");
        digitalWrite(RPI_PIN_INT, HIGH);
      }
    }
    else
    {
      //TODO: send data it sees to Pi?
      Serial.println("Listening...");
    }
  }
  
}

void Interrogate(){
  // Send a message to rf95_server
  i = 0;
  char transmit_string[80] = "";               //Transmission string to nodes
//  delay(10);                                   //Need for Serial.available timing
  
  while(Wire.available()){                   //Read in node address to interrogate
    node_read = Wire.read();
    Serial.print("node_read: ");
    Serial.println(node_read);
    if(node_read == 100){
      Serial.println("Got stop command");
      strcat(transmit_string,"s"); 
    }
    else{
      itoa(node_read, transmit_string + i, 10);  //Add interrogation node address to string 
    }
    i++;
  }

  if (count > 3){
    delay(1000);
    count = 0;
  } else {
    delay(10);
  }
  strcat(transmit_string,"_");                       //Parse between node to and from address
  itoa(NodeAddr,transmit_string + i + 1,10);                 
  strcat(transmit_string,"_Transmit");
  Serial.print("Message to be sent:");
  Serial.println(transmit_string); delay(100);
  Serial.println("Currently Transmitting"); delay(100);
  rf95.send((uint8_t *)transmit_string, sizeof(transmit_string));

    count++;
  // Now wait for a reply
}
