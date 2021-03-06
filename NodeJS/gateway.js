var DDPClient = require("ddp");
var i2c = require('i2c');
var Gpio = require('onoff').Gpio;
var timestamp = require('timestamp');

var ARDU_ADDR = 0x41;	// 'A' for arduino

var RPI_CMD_PING = 0x00;	// Ping for bootup				Payload: 0 bytes
var RPI_CMD_SEND = 0x11;	// Send data to RPi				Payload: N bytes
var RPI_CMD_INTERR = 0x22;	// Send interrogation signal through LoRa	Payload: ? bytes
var RPI_CMD_ACK = 0x33;	// Interrogation ack
var RPI_CMD_RECEIVE = 0x44;
var RPI_CMD_DONE = 0x55;

var RPI_PIN_I2C = 8;	// RPi flag pin
var nodeID = 0;	// The node ID used by LoRa, assigned by server

var RPI_PIN_INT = 11;	// RPi interrogation pin

var ddpclient = new DDPClient({
    // All properties optional, defaults shown
    host: "192.168.1.133",
    port: 3000,
    ssl: false,
    autoReconnect: true,
    autoReconnectTimer: 500,
    maintainCollections: true,
    ddpVersion: '1',	// ['1', 'pre2', 'pre1'] available
});

/*
 * Connect to the Meteor Server
 */
console.log('connecting...');
ddpclient.connect(function (error, wasReconnect) {
    // If autoReconnect is true, this callback will be invoked each time
    // a server connection is re-established
    if (error) {
        console.log('DDP connection error! Blink LED here');
        //TODO: blink LED here

    }

    if (wasReconnect) {
        console.log('Reestablishment of a connection.');
    }

    console.log('connected!');

    /*
     * Call method to assign node in network
     */
    ddpclient.call(
        'assignNode',
        [],
        function (err, result) {
            if (err) {
                console.log('Could not call -assignNode- server method');
                return;
            }

            nodeID = result;
            console.log('Assigned node ID: ', nodeID);
            ddpclient.subscribe(
                'node',
                [nodeID],
                function () {
                    console.log('Subscribed to node information');
                }
            );
        }
    );

    ddpclient.subscribe(
        'status',
        [],
        function () {
        }
    )

    /*
     * Observe a collection.
     */
    var observer = ddpclient.observe("status");
    observer.added = function (id) {
        console.log("[ADDED] to " + observer.name + ":	" + id);
    };
    observer.changed = function (id, oldFields, clearedFields, newFields) {
        console.log("[CHANGED] in " + observer.name + ":	" + id);
        console.log("[CHANGED] old field values: ", oldFields);
        console.log("[CHANGED] cleared fields: ", clearedFields);
        console.log("[CHANGED] new fields: ", newFields);

        if (id == '1') {
            ddpclient.call('getStatus', [], function(err, result) {
                wire.writeBytes(RPI_CMD_INTERR, [result.command], function (err) {
                    if(!err) {
                        console.log('all good');
                    }
                });
            });
        }
    };
    observer.removed = function (id, oldValue) {
        console.log("[REMOVED] in " + observer.name + ":	" + id);
        console.log("[REMOVED] previous value: ", oldValue);
    };
    //setTimeout(function() { observer.stop() }, 6000);

    // set up I2C
    wire = new i2c(ARDU_ADDR, {device: '/dev/i2c-1'}); // point to your i2c address, debug provides REPL interface

    // // set up Interrogation pin
    // var int_flag = new Gpio(RPI_PIN_INT, 'in', 'rising');
    // int_flag.watch(function (err, value) {
    // 	if (err) {
    // 		return;
    // 	}
    //
    // 	// Arduino is telling us to interrogate!
    // 	wire.writeByte(RPI_CMD_ACK, function(err) {
    // 		if(!err) {
    // 			ddpclient.call(
    // 				'arduinoStatus',
    // 				[nodeID, 'interrogating this node'],
    // 				function (error, result) {
    // 					console.log(result);
    // 				}
    // 			);
    // 		}
    // 	});
    // });

    // set up I2C flag
    var i2c_flag = new Gpio(RPI_PIN_I2C, 'in', 'rising'); //use GPIO pin 4 as output
    i2c_flag.watch(function (err, value) { //Watch for hardware interrupts on i2c_flag GPIO
        if (err) { //if an error
            console.error('There was an error', err); //output error message to console
            return;
        }

        // Arduino has something to say, request over I2C
        wire.writeByte(RPI_CMD_SEND, function (err) {
            if (!err) {
                buffer = [];
                if (!reading) {
                    reading = true;
                    message_size = 251;
                    readByte(0);
                }
            } else {
                console.log("no.");
            }
        });
    });
});
var reading = false;
var message_size = 251;
var buffer = [];
var readByte = function (z) {
    setTimeout(function () {
        wire.readByte(function (err, res) {
            console.log('z: ' + z + ', data: ' + res);
            if (res == 0 || res == 23 || err || z >= message_size + 50) {
                //break early
                console.log('done!');
                reading = false;
                console.log(buffer);
                ddpclient.call(
                    'arduinoMessage',
                    [buffer],
                    function (err, result) {
                        if (err) {
                            console.log('Could not call -arduinoMessage- server method');
                        } else {
                            console.log(result);
                        }
                    }
                );
                wire.writeByte(RPI_CMD_DONE, function () {
                });
            } else {
                if (z >= 50) {
                    if (z == 54) {
                        console.log('message size: ', res);
                        message_size = res + 5;
                    } else {
                        buffer.push(res);
                    }
                }
                readByte(z + 1);
            }
        });
    }, 1);

}

// Watch-Dog timer will ping Arduino for every 60 second interval of no response
var watchdog = 0;
var sendWatchDog = function () {
    setTimeout(function () {
        if (timestamp() - watchdog > 60000) {
            pingArduino();
            watchdog = timestamp();
        }
        sendWatchDog();
    }, 60000);
};

var pingArduino = function () {
    wire.writeByte(RPI_CMD_PING, recordPong);
};

var recordPong = function (err) {
    if (err) {
        console.error('There was an error', err); //output error message to console
        ddpclient.call(
            'arduinoStatus',
            [nodeID, 'disconnected'],
            function (err, result) {
                if (err) {
                    console.log('Could not call -arduinoStatus- server method');
                    return;
                }
            }
        );
    } else {
        wire.readByte(function (err, res) {
            if (!err) {
                console.log('Pong: ', res);
            }
        });
    }
};
