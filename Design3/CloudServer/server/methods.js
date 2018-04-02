import { Meteor } from 'meteor/meteor';

Meteor.methods({
    'resetNodes': function() {
        Nodes.remove({});
    },
    'resetTags': function() {
        Tags.remove({});
    },

    // ddp client methods:
    'assignNode': function() {
        return assignNode();
    },
    'arduinoStatus': function(nodeID, status) {
        console.log('Node'+nodeID+"'s"+' arduino status changed to '+status+'!');
    },

    'downloadCSV': function(origin) {
        const collection = collectAssets(origin);
        const heading = true;  // Optional, defaults to true
        const delimiter = ","; // Optional, defaults to ",";
        console.log(exportcsv.exportToCSV(collection, heading, delimiter));
        return exportcsv.exportToCSV(collection, heading, delimiter);
    }
});