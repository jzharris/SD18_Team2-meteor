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

        if(json['p']) {
            var packet = json['p'];
            if(packet['n'] && packet['l'] && packet['ti']) {
              var gpstime = parseInt(packet['ti']);
              if (typeof gpastime !== 'undefined'){
                var t = new Date();
                t.setHours(0,0,0,0);
                t.setSeconds(t.getSeconds() + parseInt(packet['ti']));
              } else {
                var t = new Date();
              }

                var nodeSubmission = {
                    nodeID: packet['n'],
                    gps: {
                        lat: packet['l']['la'],
                        lon: packet['l']['lo'],
                        timestamp: t
                    }
                };
                Nodes.insert(nodeSubmission);
                console.log(nodeSubmission);
            } else {ta
                console.log('not a valid node packet');
            }

            if(packet['n'] && packet['ta']) {
                for(var t in packet['ta']) {
                    var tagSubmission = {
                      nodeID: packet['n'].toString(),
                      tagID: parseInt(packet['ta'][t].I),
                      measurements: {
                        label: packet['ta'][t].c,
                        data: ((packet['ta'][t].s > 0) ? parseInt(packet['ta'][t].s[0]) : 0)
                      }
                    }
                    console.log(tagSubmission);
                    Tags.insert(tagSubmission);
                    // var tagSubmission = {
                    //     nodeID: packet['n'],
                    //     tagID: parseInt(message[3]),
                    //     measurements: []
                    // };
                    // tagSubmission.measurements.push({
                    //     type: 'Sensor',
                    //     label: 'Count',
                    //     data: [{
                    //         rssi: parseInt(packet['ta'][t].R),
                    //         value: packet['ta'][t].s.length > 2 ? parseInt(packet['ta'][t].s[2]) : 0
                    //     }]
                    // });
                }
            }
        } else {
            console.log('could not parse');
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

    },

    'fakeNode': function(id) {
        fakenode(id);
    },
    'fakeTag': function(id) {
        faketag(id);
    }

});
