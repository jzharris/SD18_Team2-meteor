import pexpect
import subprocess
import sys
import datetime
import RPi.GPIO as GPIO
import serial       # pyserial interfacing library
import time         # time library (sleep, clock, etc)
import math         # Math functions (Trig in particular)
import os           # OS interface library (clear, bash commands, etc)
import json
import smbus
from itertools import izip_longest
class BluetoothctlError(Exception):
	"""This exception is raised, when bluetoothctl fails to start."""
	pass


class Bluetoothctl:
	"""A wrapper for bluetoothctl utility."""

	def __init__(self):
		out = subprocess.check_output("rfkill unblock bluetooth", shell = True)
		self.child = pexpect.spawn("sudo bluetoothctl", echo = False)

	def get_output(self, command, pause = 0):
		"""Run a command in bluetoothctl prompt, return output as a list of lines."""
		self.child.send(command + "\n")
		time.sleep(pause)
		start_failed = self.child.expect(["bluetooth", pexpect.EOF])

		if start_failed:
			raise BluetoothctlError("Bluetoothctl failed after running " + command)

		return self.child.before.split("\r\n")

	def start_scan(self):
		"""Start bluetooth scanning process."""
		try:
			out = self.get_output("scan on")
		except BluetoothctlError, e:
			print(e)
			return None

	def make_discoverable(self, option):
		"""Make device discoverable."""
		try:
			out = self.get_output("discoverable " + option)
		except BluetoothctlError, e:
			print(e)
			return None

	def parse_device_info(self, info_string):
		"""Parse a string corresponding to a device."""
		device = {}
		block_list = ["[\x1b[0;", "removed"]
		string_valid = not any(keyword in info_string for keyword in block_list)

		if string_valid:
			try:
				device_position = info_string.index("Device")
			except ValueError:
				pass
			else:
				if device_position > -1:
					attribute_list = info_string[device_position:].split(" ", 2)
					device = {
						"mac_address": attribute_list[1],
						"name": attribute_list[2]
					}

		return device

	def get_available_devices(self):
		"""Return a list of tuples of paired and discoverable devices."""
		try:
			out = self.get_output("devices")
		except BluetoothctlError, e:
			print(e)
			return None
		else:
			available_devices = []
			for line in out:
				device = self.parse_device_info(line)
				if device:
					available_devices.append(device)

			return available_devices

	def get_paired_devices(self):
		"""Return a list of tuples of paired devices."""
		try:
			out = self.get_output("paired-devices")
		except BluetoothctlError, e:
			print(e)
			return None
		else:
			paired_devices = []
			for line in out:
				device = self.parse_device_info(line)
				if device:
					paired_devices.append(device)

			return paired_devices

	def get_discoverable_devices(self):
		"""Filter paired devices out of available."""
		available = self.get_available_devices()
		paired = self.get_paired_devices()

		return [d for d in available if d not in paired]

	def get_device_info(self, mac_address):
		"""Get device info by mac address."""
		try:
			out = self.get_output("info " + mac_address)
		except BluetoothctlError, e:
			print(e)
			return None
		else:
			return out

	def pair(self, mac_address):
		"""Try to pair with a device by mac address."""
		try:
			out = self.get_output("pair " + mac_address, 4)
		except BluetoothctlError, e:
			print(e)
			return None
		else:
			res = self.child.expect(["Failed to pair", "Pairing successful", pexpect.EOF])
			success = True if res == 1 else False
			return success

	def remove(self, mac_address):
		"""Remove paired device by mac address, return success of the operation."""
		try:
			out = self.get_output("remove " + mac_address, 3)
		except BluetoothctlError, e:
			print(e)
			return None
		else:
			res = self.child.expect(["not available", "Device has been removed", pexpect.EOF])
			success = True if res == 1 else False
			return success

	def connect(self, mac_address):
		"""Try to connect to a device by mac address."""
		try:
			out = self.get_output("connect " + mac_address, 2)
		except BluetoothctlError, e:
			print(e)
			return None
		else:
			res = self.child.expect(["Failed to connect", "Connection successful", pexpect.EOF])
			success = True if res == 1 else False
			return success

	def disconnect(self, mac_address):
		"""Try to disconnect to a device by mac address."""
		try:
			out = self.get_output("disconnect " + mac_address, 2)
		except BluetoothctlError, e:
			print(e)
			return None
		else:
			res = self.child.expect(["Failed to disconnect", "Successful disconnected", pexpect.EOF])
			success = True if res == 1 else False
			return success


#############################################################################################################################################
#Tag Team Code

class My_blueTooth():
	def __init__(self):
		self.bl = Bluetoothctl()


	def blue_scan_me(self):
		offTime=1700
		self.bl = Bluetoothctl()
		self.bl.start_scan()
		for i in range(0, offTime+200):
			time.sleep(.001)
		self.devices=self.bl.get_discoverable_devices()

	def blue_tooth_clear(self):
		i=0
		while i<len(self.devices):
			name = self.devices[i]['name']
			self.bl.remove(self.devices[i]['mac_address'])
			i=i+1

	def blue_tooth_parse(self):
		i=0
		bluetooth_string=''
		tag_list=[]
		while i<len(self.devices):
			name = self.devices[i]['name']
			if name[0:4]=="tags":
				info=self.bl.get_device_info(self.devices[i]['mac_address'])
				RSSI= info[-2].replace('\t','')
				if RSSI[0:4]=="RSSI":
					myrssi=RSSI[5:]
					name=name[4:]
					while len(name)!=0:
						bluetooth_string=bluetooth_string+name[0:4]+'\t'
						name= name[4:]
					bluetooth_list=bluetooth_string.split('\t')
					bluetooth_list=bluetooth_list[:len(bluetooth_list)-1]
					#catagory=bluetooth_list[0]
					#tagid=bluetooth_list[1]
					sensordata=bluetooth_list[2:]
					tag_list.append({'R':myrssi,'s':sensordata})
					tag_list.append({'R':myrssi,'s':sensordata})
			i=i+1
		return tag_list

	def send_interrogation(self, channel): #sends out interrogation signal and returns tags scanned
		GPIO.output(channel,GPIO.HIGH)
		self.blue_scan_me()
		print self.devices
		GPIO.output(channel,GPIO.LOW)
		tags=self.blue_tooth_parse()
		print tags
		return tags

	def change_name(self, name):
		self.bl = Bluetoothctl()
		os.system("sudo hostnamectl --pretty set-hostname " + name)
		os.system("sudo service bluetooth restart")
		time.sleep(5) #may need to be changed . Making sure the ble service has enough time to restart
		self.bl.make_discoverable("on")
		print("sending interagation signal")
		time.sleep(5) #may need to be changed. Making sure it is discoverable
		self.bl.make_discoverable("off")
		print("stop")

	def receive_tags(self):
		self.blue_scan_me()
		print self.devices
		tags=self.blue_tooth_parse()
		print tags
		return tags

###############################################################################################################################################
###############################################################################################################################################
#Node Team JSON
"""TagId
Sensor
GPS
Timestp
NodeID"""

def export_json_str(gpstimestamp,gpslocation,tags):
	#global tostore
	#tostore[gpstimestamp]={'tags':tags,'NodeID':nodeID,'Location':gpslocation}
	tostore['p'] = {'ta':tags,'n':nodeID,'l':gpslocation,'ti':gpstimestamp}
	message=json.dumps(tostore)
	print message
	return message

def String_2_Bytes(message):
    data = []
    for c in message:
            data.append(ord(c))
    return data

def grouper(iterable, n, fillvalue=None):
    args = [iter(iterable)] * n
    return izip_longest(*args, fillvalue=fillvalue)

class MyI2C:
	 def __init__(self):
	 	self.bus = smbus.SMBus(1)    # 0 = /dev/i2c-0 (port I2C0), 1 = /dev/i2c-1 (port I2C1)
	 def send_message(self, message):
	 	new_message=String_2_Bytes(message)
		new_message.insert(0, new_message.__len__())
	 	new_message.append(1)
		print new_message.__len__()
	 	grouped = list(grouper(new_message, 31, 1))
	 	print grouped

	 	for i in range(grouped.__len__()):
                        print list(grouped[i])
                        self.bus.write_i2c_block_data(ARDU_ADDR, 0x44, list(grouped[i]))
                        time.sleep(.1)


###############################################################################################################################################
#Node Team GPS
#! /usr/bin/python
# Thomas Dearing, Adapted from Online Resources
# License: GPL 2.0
# 3/15/2018

# Notes:
# 1) For connections with the TTL->Serial cable, use the following pinout:
#       (White,green,black,red) => (TX,RX,GND,VIN)
#    For connections to the Pi3 or Pi zero UART, use the following pinout: (Pin 1 is next to micro sd card)
#       PI UART TX/RX => Pins 8 / 10
#       PI GND/5V     => Pins 6 / 4
#    Combined pins should make a ribbon
# 2) Compute PMTK Checksums by applying Xor to str in $<str>* using the following resource
#       http://www.scadacore.com/field-tools/programming-calculators/online-checksum-calculator/
# 3) Test GGA String:
#    $GPGGA,000022.800,3404.4911,N,10653.9340,W,2,08,1.14,1402.8,M,-24.1,M,0000,0000*6D
#       0        1         2     3      4     5 6 7    8     9   10  11  12 13   14
# 4) Currently failure of primary methods results in exit()





class GPS:
	# Opens a serial connection with a USB connected adafruit 66 channel GPS, manages communications and NMEA
	# sentence interpretation, and conversion of Lat/Lon readings into local distances with respect to the first
	# successful reading. The following methods are implimented in this class:
	#
	#   GPS.__init__()  : Opens serial connection, sets up GPS update rate, and prints success/failure messages
	#                     for GPS config options. Default is 57600 Baud with 5 Hz GPS updates.
	#   GPS.Get_ACK     : Checks serial line (over next 10 received messages) for GPS acknowledge signal for config
	#                     commands. Used heavily in Init() to ensure configuration is certain
	#   GPS.read()      : Reads most recent NMEA sentence sent by GPS (discards intermediate samples), interprets
	#                     that sentence, and stores results as class variables. The following information is made
	#                     available or updated on a call of GPS.read():
	#                           Current GPS time        : GPS.time_s
	#                           Current GPS fix state   : GPS.fix
	#                                   0 : No fix
	#                                   1 : 2D fix (no altitude)
	#                                   2 : 3D fix
	#                           Number of tracked sats  : GPS.sats
	#                           Current Latitude (N)    : GPS.Lat_float
	#                           Current Longitude (E)   : GPS.Lon_float
	#                           Current Altitude        : GPS.alt
	#                           Differential Distances (in m from starting pos.):
	#                               Distance Eastward   : GPS.dx
	#                               Distance Northward  : GPS.dy
	#                               Distance Upward     : GPS.dz
	#
	# Running this file as a main() will write current readings to the screen as well as an Output file in the
	# open directory called GPS_Output_File.txt, tab delimited with easy input to MATLAB via readtable()
	#-------------------------------------------------------------------------------------------------------------

	def __init__(self):
		#------------------------------------------PMTK COMMAND LIST----------------------------------------------
		# This set is used to set the rate the GPS reports
		UPDATE_1_sec    = "$PMTK220,1000*1F\r\n"            # Update Every One Second
		UPDATE_200_msec = "$PMTK220,200*2C\r\n"             # Update Every 200 ms
		UPDATE_100_msec = "$PMTK220,100*2F\r\n"             # Update Every 100 ms

		# This set is used to set the rate at which the GPS takes measurements
		MEAS_1_sec      = "$PMTK300,1000,0,0,0,0*1C\r\n"    # Measure once a second
		MEAS_200_msec   = "$PMTK300,200,0,0,0,0*2F\r\n"     # Meaure 5 times a second
		MEAS_100_msec   = "$PMTK300,100,0,0,0,0*2C\r\n"     # Meaure 10 times a second

		# Set the Baud Rate of the GPS, wait 0.5s after command to apply
		BAUD_115200     = "$PMTK251,115200*1F\r\n"          # Set Baud Rate at 115200
		BAUD_57600      = "$PMTK251,57600*2C\r\n"           # Set Baud Rate at 57600
		BAUD_38400      = "$PMTK251,38400*27\r\n"           # Set Baud Rate at 38400
		BAUD_19200      = "$PMTK251,19200*22\r\n"           # Set Baud Rate at 19200
		BAUD_9600       = "$PMTK251,9600*17\r\n"            # Set 9600 Baud Rate

		# Commands for which NMEA Sentences are sent (support for GPGGA only at the moment)
		GPRMC_ONLY      = "$PMTK314,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*29\r\n" # Send only the GPRMC Sentence
		GPGGA_ONLY      = "$PMTK314,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*29\r\n" # Send only the GPGGA Sentence
		GPRMC_GPGGA     = "$PMTK314,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*28\r\n" # Send GPRMC AND GPGGA Sentences
		SEND_ALL        = "$PMTK314,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0*28\r\n" # Send All Sentences
		SEND_NOTHING    = "$PMTK314,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*28\r\n" # Send Nothing

		# Command to enable WAAS
		GPS_ENABLE_WAAS = "$PMTK301,2*2E\r\n"
		#---------------------------------------------------------------------------------------------------------
		Initial_Baud    = 9600                              # Should be 9600, (Default is sometimes 57600 on GPS)
		Serial_Dev      = '/dev/ttyS0'                      # Default Serial Device for system (/dev/ttyUSB0 for TTL-Serial,
															# /dev/ttyS0 or /dev/Serial0 for UART)


		# Open Serial port with connected Adafruit GPS
		self.serialPort = serial.Serial(Serial_Dev,Initial_Baud) # Initialize serial Port
		if (self.serialPort.isOpen() == False):
			print "Error: GPS SerialPort failed to open"
			print "Exiting..."
			exit()

		# Clear Serial Buffers
		self.serialPort.flushInput()
		self.serialPort.flushOutput()

		'''
		#-----------------------------------------------------------------------------------
		# Initial Connection Debugging
		self.serialPort.write(BAUD_9600)                    # Ensure Baud Rate
		time.sleep(0.5)
		self.serialPort.baudrate = 9600
		self.serialPort.flushInput()
		self.serialPort.flushOutput()
		print("\nSetting GPS measurement Rate (Default Baud), Reply follows:")
		self.serialPort.write(MEAS_1_sec)
		self.Get_ACK()

		self.serialPort.write(BAUD_9600)                   # Set Baud Rate
		time.sleep(0.5)                                    # Wait for command to execute
		self.serialPort.baudrate = 9600                    # Update serial Baudrate to match GPS
		self.serialPort.flushInput()
		self.serialPort.flushOutput()
		print(self.serialPort.readline())

		self.serialPort.write(MEAS_1_sec)
		print("\nSetting GPS measurement Rate (New Baud), Reply follows:")
		self.Get_ACK()

		exit()
		#-----------------------------------------------------------------------------------
		'''


		# Set update rate (57600 works, 115200 gets rejected (I have no idea why))
		self.serialPort.write(BAUD_115200)          # Set Baud Rate
		time.sleep(0.5)                             # Wait for command to execute
		self.serialPort.baudrate = 115200           # Update serial Baudrate to match GPS
		print("\nSetting Serial Baud Rat (ACK unavailable),")
		print("\tKill via cntrl + C if program hangs here,")
		self.serialPort.flushInput()
		print("\tRead Test := {0:s}".format(self.serialPort.readline()))

		# Ask for only GPRMC and GPGGA Sentences
		self.serialPort.write(GPGGA_ONLY)
		print("\nSetting NMEA Sentence Type, Reply follows:")
		self.Get_ACK()

		# Set GPS measurement rate
		self.serialPort.write(MEAS_100_msec)
		print("\nSetting GPS measurement Rate, Reply follows:")
		self.Get_ACK()

		# Set GPS report rate
		self.serialPort.write(UPDATE_100_msec)
		print("\nSetting GPS Report Rate, Reply follows:")
		self.Get_ACK()

		# Enable WAAS mode
		self.serialPort.write(GPS_ENABLE_WAAS)
		print("\nEnabling WAAS, Reply follows:")
		self.Get_ACK()

		# Wait to view output
		time.sleep(0.5)

		# Set initial Values
		self.Init_Reading = 0                   # Flag indicating good reading found
	#-------------------------------------------------------------------------------------------------------------


	# Get ACK response for GPS PMTK Command
	def Get_ACK(self):
		# GPS ACK signature/Code intepretation
		GPS_ACK         = "$PMTK001"
		GPS_ACK_code    = {"0" : "Invalid Command Packet",
						   "1" : "Unsupported Command",
						   "2" : "Valid Packet: Action Failed",
						   "3" : "Valid Packet: Action Succeeded"}
		Num_tries       = 10
		Serial_timeout  = 5

		for i in range(0,Num_tries):
			ACK_t0 = time.time()
			while(self.serialPort.inWaiting() == 0):
				if((time.time()-ACK_t0) >= Serial_timeout):
					print "\tError: No Serial Response Found"
					self.serialPort.close()
					print "\tExiting..."
					exit()
				time.sleep(0.01)

			NMEA_in = self.serialPort.readline()
			NMEA_in_Prs = NMEA_in.split(",")
			if(NMEA_in_Prs[0] == GPS_ACK):
				print("\tReceived ACK on command {}:".format(NMEA_in_Prs[1]))
				print("\t{}".format(GPS_ACK_code[ NMEA_in_Prs[2].split("*")[0] ]))
				break
			if (i == 9):
				print("\tACK not received, Exiting...")
				self.serialPort.close()
				exit()

	#-------------------------------------------------------------------------------------------------------------


	# Read and process GPS Data for utilization by control system
	#   NOTE: Only call at LESS THEN OR EQUAL to gps sample rate (5 Hz) to read with minimal delay in method
	#         Calling at a faster rate will cause a serial read delay (for gps to recieve info)
	def read(self):
		# serialPort.flushInput()
		# serialPort.flushOutput()
		N_msg = 0                                           # Counter of NMEA sentences pulled from serial cache
		t_0   = time.time()
		# print("NMEA String (Inwaiting = {0:d})> {1}".format(self.serialPort.inWaiting(),self.serialPort.readline()))

		# Read most recent NMEA sentence from serial port (Will stay in loop until new sentence found)
		while(1):
			if self.serialPort.inWaiting() > 0:             # More recent reading in cache, read it
				self.NMEA1 = self.serialPort.readline()
				N_msg += 1
			elif(N_msg != 0):                               # No reading in cache, but reading stored
				break
		# print("{0:d} strings discarded".format(N_msg-1))  # DEBUG: Count message discard rate

		NMEA1_array = self.NMEA1.split(",")

		# Interpret NMEA sentence by type
		try:
			if NMEA1_array[0] == "$GPGGA":
				# Collect GPS time in seconds
				self.time_s   = 3600.0*int(NMEA1_array[1][:2]) + 60.0*int(NMEA1_array[1][2:4]) + float(NMEA1_array[1][4:])
				self.fix      = int(NMEA1_array[6])         # GPS Fix Flag

				# Values only available on fix
				if(self.fix != 0):
					self.Lat_deg  = int(NMEA1_array[2][:-7])    # Latitude (degrees)
					self.Lat_min  = float(NMEA1_array[2][-7:])  # Latitude (minutes)
					self.Lat_hem  = NMEA1_array[3]              # N,S, orientation of latitude reading
					self.Lon_deg  = int(NMEA1_array[4][:-7])    # Longitude (degrees)
					self.Lon_min  = float(NMEA1_array[4][-7:])  # Longitude (minutes)
					self.Lon_hem  = NMEA1_array[5]              # E,W, orientation of longitude reading
					self.sats     = int(NMEA1_array[7])         # Number of connected sats
					self.Horiz_dil= float(NMEA1_array[8])       # Horizontal dilution
					self.alt      = float(NMEA1_array[9])       # Current altitude [m]
					# self.D_updt   = int(NMEA1_array[13])        # time since last differential update

					# Compute N Reading latitude (float)
					self.Lat_float = self.Lat_deg + self.Lat_min/60.0
					if(self.Lat_hem == 'S'):
						self.Lat_float = -self.Lat_float

					# Compute E Reading longitude (float)
					self.Lon_float = self.Lon_deg + self.Lon_min/60.0
					if(self.Lon_hem == 'W'):
						self.Lon_float = -self.Lon_float

					# Acquire initial location measurement
					if (self.Init_Reading == 0):
						self.Lat_float_0 = self.Lat_float
						self.Lon_float_0 = self.Lon_float
						self.alt_0       = self.alt

						# Compute differential coordinate conversions (degrees to km in Lat/Lon)
						self.Km_Lat =  (111.13209 * math.cos(0*self.Lat_float_0*(math.pi/180))) \
									 + ( -0.56605 * math.cos(2*self.Lat_float_0*(math.pi/180))) \
									 + (  0.00120 * math.cos(4*self.Lat_float_0*(math.pi/180)))
						self.Km_Lon =  (111.41513 * math.cos(1*self.Lat_float_0*(math.pi/180))) \
									 + ( -0.09455 * math.cos(3*self.Lat_float_0*(math.pi/180))) \
									 + (  0.00012 * math.cos(5*self.Lat_float_0*(math.pi/180)))
						self.Init_Reading = 1

					# Compute Differential distance [m] from starting location
					D_Lat = (self.Lat_float - self.Lat_float_0);            # Differential Latitude from starting point
					D_Lon = (self.Lon_float - self.Lon_float_0);            # Differential Longitude from starting point

					self.dx = D_Lon*self.Km_Lon*1000;                       # Map positive x to east of prime meridian
					self.dy = D_Lat*self.Km_Lat*1000;                       # Map positive y to north of equator
					self.dz = self.alt - self.alt_0;                        # Map positive z to altitude

			else:
				print "Invalid (Or unsupported) NMEA Sequence!"
		except Exception:
			print "Something went wrong..."

		self.read_time = time.time() - t_0

		#-------------------------------------------------------------------------------------------------------------

	def out_put_time_and_pos(self):
		self.read()
		mytime="{0:<10.3f}".format(myGPS.time_s)
		myfix="{0:d}".format(myGPS.fix)
		if(self.fix != 0 ):
			if myGPS.Lat_hem =='N':
				mylat=self.Lat_deg+self.Lat_min/60#,myGPS.Lat_hem]#"{0:<4d}deg {1:<7.4f}min {2}".format(myGPS.Lat_deg,myGPS.Lat_min,myGPS.Lat_hem)
			else:
				mylat=-(self.Lat_deg+self.Lat_min/60)
			if myGPS.Lon_hem =='W':
				mylon=-(self.Lon_deg+self.Lon_min/60)#),myGPS.Lon_hem]#"{0:<4d}deg {1:<7.4f}min {2}".format(myGPS.Lon_deg,myGPS.Lon_min,myGPS.Lon_hem)
			else:
				mylon=self.Lon_deg+self.Lon_min/60

		else:
			print "\tInvalid Values (no fix)"

			# Print to file
			mylat="NaN"
			mylon="NaN"
		return mytime, {'la': mylat, 'lo': mylon}



nodeID 				= 2
tostore 			= {}
ARDU_ADDR			= 0x41  # 'A' for arduino
RPI_CMD_PING		= 0x00  # Ping for bootup				Payload: 0 bytes
RPI_CMD_SEND		= 0x11  # Send data to RPi				Payload: N bytes
RPI_CMD_INTERR		= 0x22  # Send interrogation signal through LoRa	Payload: ? bytes
RPI_CMD_ACK			= 0x33  # Interrogation ack

RPI_PIN_I2C			= 8 	# RPi flag pin
#nodeID				= 0 	# The node ID used by LoRa, assigned by server

RPI_PIN_INT			= 11 	# RPi interrogation pin
INT_ENABLE 			= 0 	# Enable FLG for interrogation pin

myGPS = None
blue = None
myI2c = None
busy = False

#---------------------------------------------------------------------------
# Interrupts
def Enable_Interrogate(channel):
	busy = True
	print 'event!'
	GPIO.output(21, 1)
	time.sleep(1)
	tags = blue.receive_tags()
	gpstimestamp, gpslocation = myGPS.out_put_time_and_pos()
	export_json_str(gpstimestamp, gpslocation, tags)
	myI2c.send_message(export_json_str(gpstimestamp, gpslocation, tags))
	GPIO.output(21, 0)
	busy = False


#---------------------------------------------------------------------------


if __name__ == "__main__":
	myI2c = MyI2C()

	# Configure GPIO Pins
	GPIO.setmode(GPIO.BOARD) 	# Use Physical Pin numbers for GPIO Channel ref (I.E use 40 for GPIO21)
	GPIO.setup(RPI_PIN_INT, GPIO.IN)
	GPIO.setup(21, GPIO.OUT)
	#GPIO.setup(3,GPIO.OUT)
	#GPIO.setup(9, GPIO.IN)
    #GPIO.setup(messageInterruptPIN, GPIO.IN)

    # Watch for interrogate signal from arduino (software interrupt)
        GPIO.add_event_detect(RPI_PIN_INT, GPIO.RISING, callback = Enable_Interrogate)

    # Enable GPS and bluetooth instances
	myGPS = GPS()
	blue  = My_blueTooth()
	#counter=1000
	#while(counter!=0):
	while(1):
		if(not busy):
			GPIO.output(21, 1)
			time.sleep(1)
			tags=blue.receive_tags()
			gpstimestamp,gpslocation = myGPS.out_put_time_and_pos()
			print export_json_str(gpstimestamp,gpslocation,tags)
			myI2c.send_message(export_json_str(gpstimestamp,gpslocation,tags))
			GPIO.output(21, 0)
			time.sleep(60)

