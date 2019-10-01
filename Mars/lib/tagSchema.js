// Define the schema
TagSchema = new SimpleSchema({
    tagID: {
        type: String,
        label: "Tag ID"
    },
    nodeID: {
        type: String,
        label: "Node ID that the tag sent the event to"
    },
    sent: {
        type: Date,
        label: "Time sent from fog server"
    },
    received: {
        type: Date,
        label: "Time received by cloud server"
    },
    measurements: {
        type: Array,
        label: "Measurements"
    },
    'measurements.$': {
        type: Object
    },
    'measurements.$.type': {
        type: String,
        label: "Type of measurement"
    },
    'measurements.$.label': {
        type: String,
        label: "Label of measurement given by node"
    },
    'measurements.$.data': {
        type: Object,
        label: "Data for this measurement"
    }
});