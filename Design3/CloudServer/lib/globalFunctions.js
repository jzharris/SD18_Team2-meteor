import { Random } from 'meteor/random';

node = function() {
    return {
        nodeID: Random.id(),
        nodeVersion: '1.0.0',
        nodeType: 'Tester',
        battery: {
            voltage: Random.fraction()*10,
            amperage: Random.fraction()*2,
            timestamp: new Date()
        },
        gps: {
            lat: Random.fraction()*1000,
            lon: Random.fraction()*1000,
            timestamp: new Date()
        }
    };
};

tag = function(nodeID, tagID) {

    let arr = [];
    for (let i = 1; i <= 10; i++) {
        arr.push(i);
    }

    //random number of measurements between 1 and 10
    let measure = [];
    for (let i = 0; i < Random.choice(arr); i++) {
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
        measurements: measure
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