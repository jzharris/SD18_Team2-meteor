// Define the schema
NodeSchema = new SimpleSchema({
    nodeID: {
        type: String,
        label: "Node ID"
    },
    nodeVersion: {
        type: String,
        label: "Node version"
    },
    nodeType: {
        type: String,
        label: "Node type"
    },
    sent: {
        type: Date,
        label: "Time sent from fog server"
    },
    received: {
        type: Date,
        label: "Time received by cloud server"
    },
    origin: {
        type: String,
        label: "Origin of item"
    },
    configuration: {
        type: Object,
        label: "Configuration of node"
    },
    'configuration.connectionSpeed': {
        type: Number,
        label: "Connection speed"
    },
    'configuration.powerMin': {
        type: Number,
        label: "Minimum power requirement"
    },
    'configuration.powerLimit': {
        type: Number,
        label: "Power draw limit"
    },
    'configuration.tagLimit': {
        type: Number,
        label: "Tag handle limit"
    },
    battery: {
        type: Object,
        label: "Battery object"
    },
    'battery.voltage': {
        type: Number,
        label: "Voltage of battery"
    },
    'battery.amperage': {
        type: Number,
        label: "Amperage of battery"
    },
    'battery.timestamp': {
        type: Date,
        label: "Timestamp of measurement"
    },
    gps: {
        type: Object,
        label: "GPS"
    },
    'gps.lat': {
        type: Number,
        label: "Latitude"
    },
    'gps.lon': {
        type: Number,
        label: "Longitude"
    },
    'gps.timestamp': {
        type: Date,
        label: "Timestamp of measurement"
    },
});