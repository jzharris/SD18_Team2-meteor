var DDPClient = require("ddp");
var i2c = require('i2c');
var Gpio = require('onoff').Gpio;

var ARDU_ADDR		= 0x41	// 'A' for arduino

var RPI_CMD_PING	= 0x00	// Ping for bootup				Payload: 0 bytes
var RPI_CMD_SEND	= 0x11	// Send data to RPi				Payload: N bytes
var RPI_CMD_INTERR	= 0x22	// Send interrogation signal through LoRa	Payload: ? bytes

var RPI_PIN_I2C		= 8	// RPi flag pin

var ddpclient = new DDPClient({
	// All properties optional, defaults shown
	host : "192.168.1.133",
	port : 3000,
	ssl	: false,
	autoReconnect : true,
	autoReconnectTimer : 500,
	maintainCollections : true,
	ddpVersion : '1',	// ['1', 'pre2', 'pre1'] available
});

/*
 * Connect to the Meteor Server
 */
console.log('connecting...');
ddpclient.connect(function(error, wasReconnect) {
	// If autoReconnect is true, this callback will be invoked each time
	// a server connection is re-established
	if (error) {
		console.log('DDP connection error!');
		return;
	}

	if (wasReconnect) {
		console.log('Reestablishment of a connection.');
	}

	console.log('connected!');

	setTimeout(function () {
		/*
		 * Call a Meteor Method
		 */
		/*
		ddpclient.call(
			'testMethod',						 // name of Meteor Method being called
			['foo', 'bar'],						// parameters to send to Meteor Method
			function (err, result) {	 // callback which returns the method call results
				console.log('called function, result: ' + result);
			},
			function () {							// callback which fires when server has finished
				console.log('updated');	// sending any updated documents as a result of
				 // calling this method
			}
		);
		*/
	}, 3000);

	/*
	 * Subscribe to a Meteor Collection
	 */
	ddpclient.subscribe(
		'nodes',									// name of Meteor Publish function to subscribe to
		[],											 // any parameters used by the Publish function
		function () {						 // callback when the subscription is complete
			console.log('nodes:');
			console.log(ddpclient.collections.nodes);
		}
	);

	/*
	 * Observe a collection.
	 */
	/*
	var observer = ddpclient.observe("posts");
	observer.added = function(id) {
		console.log("[ADDED] to " + observer.name + ":	" + id);
	};
	observer.changed = function(id, oldFields, clearedFields, newFields) {
		console.log("[CHANGED] in " + observer.name + ":	" + id);
		console.log("[CHANGED] old field values: ", oldFields);
		console.log("[CHANGED] cleared fields: ", clearedFields);
		console.log("[CHANGED] new fields: ", newFields);
	};
	observer.removed = function(id, oldValue) {
		console.log("[REMOVED] in " + observer.name + ":	" + id);
		console.log("[REMOVED] previous value: ", oldValue);
	};
	setTimeout(function() { observer.stop() }, 6000);
	*/

	// set up I2C
	var wire = new i2c(ARDU_ADDR, {device: '/dev/i2c-1'}); // point to your i2c address, debug provides REPL interface

	// set up I2C flag
	var i2c_flag = new Gpio(RPI_PIN_I2C, 'in', 'rising'); //use GPIO pin 4 as output

	i2c_flag.watch(function (err, value) { //Watch for hardware interrupts on i2c_flag GPIO, specify callback function
		if (err) { //if an error
			console.error('There was an error', err); //output error message to console
			return;
		}
		console.log("i2c_flag is high!");

		// Arduino has something to say, request over I2C
		wire.writeByte(RPI_CMD_SEND, function(err) {
			if (err) {
				console.error('There was an error', err); //output error message to console
			} else {
				console.log('Sent through i2c! Time to read...');

				wire.readByte(function(err, res) {
					if (err) {
						console.error('There was an error', err); //output error message to console
					} else {
						console.log('Pong: ', res);
					}
				});
			}
		});
	});
});
