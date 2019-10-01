# 2018 New Mexico Tech EE Senior Design Project

## Big Picture

![System Functional Schematic](https://github.com/jzharris/SD18_Team3-meteor/blob/master/Materials/Node_Functional_Schematic.png)

## Contents

- `Arduino`: Arduino project that communicates data over a LoRa network
- `Design3`: Loads tests of the Server-Client interface to measure the data-limits of the WiFi comms system
- `Mars`: Final release of the UI system
- `Materials`: Final presentation materials
- `NodeJS`: Arduino project that sends the collected information to the main processing unit (Raspberry Pi)
- `RPi`: Raspberry Pi operating code, gathers data sent via BT tags. Sends data through Arduino LoRa, and via WiFi if connected
- `UI`: old UI code, housing previous versions of the UI template
