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
    'nodePacket': function(message) {
        console.log('Receiving: ', message);
        let parsed = JSON.parse(message);
        console.log('Parsed: ');
        console.log(parsed);
    },

    'downloadCSV': function(origin) {
        const collection = collectAssets(origin);
        const heading = true;  // Optional, defaults to true
        const delimiter = ","; // Optional, defaults to ",";
        console.log(exportcsv.exportToCSV(collection, heading, delimiter));
        return exportcsv.exportToCSV(collection, heading, delimiter);
    },

    'randomNodeId': function(){
      randomNode = SortedNodes.aggregate([
        {$sample: {size: 3}},
        {$project: {_id: 1}}
      ]);
      //console.log(randomNode);
      return randomNode

    },

    'getStatus': function(){
      return Status.findOne({});
    }

});
