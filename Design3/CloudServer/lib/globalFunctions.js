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