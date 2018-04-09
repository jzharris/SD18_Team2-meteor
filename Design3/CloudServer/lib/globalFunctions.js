import { Random } from 'meteor/random';

node = function() {
    return {
        nodeID: Random.id(),
        nodeVersion: '1.0.0',
        nodeType: 'Tester',
        gps: {
            lat: Random.fraction()*1000,
            lon: Random.fraction()*1000,
            timestamp: new Date()
        },
        sent: Date.now()
    };
};

tag = function(nodeID, tagID) {

    let arr = [];
    for (let i = 1; i <= 10; i++) {
        arr.push(i);
    }

    //4 measurements per event (2x2 array)
    let measure = [];
    for (let i = 0; i < 2; i++) {
        measure.push({
            type: 'Type',
            label: 'Label',
            data: {
                random1: Random.fraction(),
                random2: Random.fraction()*10
            }
        });
    }

    return {
        tagID: tagID,
        nodeID: nodeID,
        measurements: measure,
        sent: Date.now()
    };
};

collectAssets = function(origin) {

    const nodes = Nodes.find({sent: {$exists : true}, origin: origin}, {sort: {sent: 1}}).map(function(x) {
        return {
            sent: x.sent,
            received: x.received,
            origin: x.origin,
            node: 1
        };
    });

    const tags = Tags.find({sent: {$exists : true}, origin: origin}, {sort: {sent: 1}}).map(function(x) {
        return {
            sent: x.sent,
            received: x.received,
            origin: x.origin,
            node: 0
        };
    });

    return nodes.concat(tags);

};

dataPresent = function(origin) {

    return Nodes.findOne({sent: {$exists : true}, origin: origin}) ||
    Tags.findOne({sent: {$exists : true}, origin: origin})

};

nodeArray = [];
assignNode = function() {
    const newID = nodeArray.length+1;
    nodeArray.push(newID);

    return newID;
};