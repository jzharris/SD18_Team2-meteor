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
            let packet = json['p'];
            let time = null;
            if (packet['n'] && packet['l'] && packet['ti']) {
                let gpstime = parseInt(packet['ti']);
                if (typeof gpstime !== 'undefined') {
                    time = new Date();
                    time.setHours(0, 0, 0, 0);
                    time.setSeconds(time.getSeconds() + gpstime);
                } else {
                    time = new Date();
                }

                let nodeSubmission = {
                    nodeID: packet['n'],
                    gps: {
                        lat: packet['l']['a'],
                        lon: packet['l']['o'],
                        timestamp: time
                    }
                };
                Nodes.insert(nodeSubmission);
                console.log(nodeSubmission);
            } else {
                console.log('not a valid node packet');
            }

            if (packet['n'] && packet['ta']) {
                let split1 = packet['ta'].split(';');
                for (let tag in split1) {
                    if(split1[tag]) {
                        let split2 = split1[tag].split(' ');
                        let tagSubmission = {
                            nodeID: packet['n'].toString(),
                            tagID: parseInt(split2[1] ? split2[1] : 0),
                            measurements: {
                                label: split2[0] ? (split2[0] === 'c' ? 'cnts' : 'volt') : 'null',
                                data: split2[2] ? parseInt(split2[2]) : []
                            }
                        };
                        console.log(tagSubmission);
                        Tags.insert(tagSubmission);
                    }
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
