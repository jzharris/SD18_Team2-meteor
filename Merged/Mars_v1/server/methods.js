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
    'getStatus': function(){
        return Status.findOne({});
    },
    'arduinoMessage': function(message) {
        console.log('Message from Arduino: ');
        var result = "";
        var i;
        for(i = 4; i < message.length; i++) {
            result += String.fromCharCode(message[i]);
        }
        console.log("\n\n" + result + "\n\n");

        var json = JSON.parse(result);

        if(json['packet']) {
            var packet = json['packet'];
            if(packet['NodeID'] && packet['Location'] && packet['TimeStamp']) {
                var t = new Date();
                t.setHours(0,0,0,0);
                t.setSeconds(t.getSeconds() + parseInt(packet['TimeStamp']));

                var nodeSubmission = {
                    nodeID: packet['NodeID'],
                    gps: {
                        lat: packet['Location']['la'],
                        lon: packet['Location']['lo'],
                        timestamp: t
                    }
                };
                Nodes.insert(nodeSubmission);
                console.log(nodeSubmission);
            } else {
                console.log('not a valid node packet');
            }

            if(packet['NodeID'] && packet['tags']) {
                var tagSubmission = {
                    nodeID: packet['NodeID'],
                    tagID: parseInt(message[3]),
                    measurements: []
                };

                for(var t in packet['tags']) {
                    tagSubmission.measurements.push({
                        type: 'Sensor',
                        label: 'Count',
                        data: [{
                            rssi: parseInt(packet['tags'][t].R),
                            value: packet['tags'][t].s.length > 2 ? parseInt(packet['tags'][t].s[2]) : 0
                        }]
                    });
                }

                Tags.insert(tagSubmission);
                console.log(tagSubmission);
            }
        } else {
            console.log('json not valid');
        }
    },
    // 'nodePacket': function(message) {
    //     console.log('Receiving: ', message);
    //     let parsed = JSON.parse(message);
    //     console.log('Parsed: ');
    //     console.log(parsed);
    // },

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

    }

});
