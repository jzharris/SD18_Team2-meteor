import {Meteor} from 'meteor/meteor';

Meteor.methods({
    'resetNodes': function () {
        Nodes.remove({});
    },
    'resetTags': function () {
        Tags.remove({});
    },

    // ddp client methods:
    'assignNode': function () {
        return assignNode();
    },
    'arduinoStatus': function (nodeID, status) {
        console.log('Node' + nodeID + "'s" + ' arduino status changed to ' + status + '!');
    },
    'getStatus': function () {
        return Status.findOne({});
    },
    'arduinoMessage': function (message) {
        console.log('Message from Arduino: ');
        var result = "";
        var i;
        for (i = 4; i < message.length; i++) {
            result += String.fromCharCode(message[i]);
        }
        console.log("\n\n" + result + "\n\n");

        var json = JSON.parse(result);

        if (json['p']) {
            var packet = json['p'];
            var time = null;
            if (packet['n'] && packet['l'] && packet['ti']) {
                var gpstime = parseInt(packet['ti']);
                if (typeof gpstime !== 'undefined') {
                    time = new Date();
                    time.setHours(0, 0, 0, 0);
                    time.setSeconds(time.getSeconds() + parseInt(packet['ti']));
                } else {
                    time = new Date();
                }

                var nodeSubmission = {
                    nodeID: packet['n'],
                    gps: {
                        lat: packet['l']['la'],
                        lon: packet['l']['lo'],
                        timestamp: time
                    }
                };
                Nodes.insert(nodeSubmission);
                console.log(nodeSubmission);
            } else {
                console.log('not a valid node packet');
            }

            if (packet['n'] && packet['ta']) {
                for (var t in packet['ta']) {
                    var tagSubmission = {
                        nodeID: packet['n'],
                        tagID: parseInt(packet['ta'][t].I),
                        sent: time,
                        measurements: {
                            label: packet['ta'][t].c,
                            data: parseInt(packet['ta'][t].s[0])
                        }
                    };
                    console.log(tagSubmission);
                    Tags.insert(tagSubmission);
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

    'downloadCSV': function (origin) {
        const collection = collectAssets(origin);
        const heading = true;  // Optional, defaults to true
        const delimiter = ","; // Optional, defaults to ",";
        console.log(exportcsv.exportToCSV(collection, heading, delimiter));
        return exportcsv.exportToCSV(collection, heading, delimiter);
    },

    'randomNodeId': function () {
        randomNode = SortedNodes.aggregate([
            {$sample: {size: 3}},
            {$project: {_id: 1}}
        ]);
        //console.log(randomNode);
        return randomNode

    },

    'fakeNode': function (id) {
        fakenode(id);
    },
    'fakeTag': function (id) {
        faketag(id);
    }

});
