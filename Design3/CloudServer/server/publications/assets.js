import {Meteor} from "meteor/meteor";

Meteor.publish('nodes', function() {
    return Nodes.find();
});

Meteor.publish('node', function(nodeID) {
    return Nodes.find({nodeID : nodeID});
});

Meteor.publish('tags', function() {
    return Tags.find();
});