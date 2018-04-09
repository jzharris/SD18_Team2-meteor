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
    };
};

tag = function(nodeID, tagID) {

    let arr = [];
    for (let i = 1; i <= 10; i++) {
        arr.push(i);
    }

    //2 measurements
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
        measurements: measure
    };
};