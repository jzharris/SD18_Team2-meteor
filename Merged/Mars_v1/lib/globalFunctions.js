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
            lat: (Random.fraction()*180) - 90,
            lon: (Random.fraction()*360) - 180,
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

triangulate = function(node_sel) {
  // Averages the locations of several nodes.
  // node_sel is an array containing the nodeID's selected for triangulation
    var num = node_sel.length;
    var lat = 0;
    var lon = 0;

    const nodes = SortedNodes.find({_id: {$in : node_sel}}).map(function(x) {

      lat += x.gps[0].lat; // Add the latest value of lat
      lon += x.gps[0].lon; // Add the latest value of lat
    });

    return {
        lat: lat/num,
        lon: lon/num,
        timestamp: new Date()
    };

};

Icon = function(name,color) {
    if (name == 'Tag'){
      this.path = "M5,15L15,15L15,5L5,5z";
      this.scale = 1;
    } else {
      this.path = "M0,20L10,0L20,20z";
      this.scale = 0.8;
    }
    this.fillColor = color;
    this.fillOpacity = 0.8;
    this.strokeWeight = 0.6;

    return {
      path: this.path,
      fillColor: this.fillColor,
      fillOpacity: this.fillOpacity,
      scale: this.scale,
      strokeWeight: this.strokeWeight,
      anchor: new google.maps.Point(10,5)
    }
}

time_diff = function(timestamp) {
var day = 60*60*24;
var hour = 60*60;
var min = 60;

now = new Date();
var diff = (now.getTime() - timestamp.getTime())/1000;

if (diff > 2*day) {
  return Math.floor(diff/day) + ' day(s)';

} else if (diff > hour) {
  return Math.floor(diff/hour) + ' hour(s)';

} else if (diff > min){
  return Math.floor(diff/min) + ' minute(s)';

} else {
  return Math.floor(diff)  + ' second(s)';
}

}
