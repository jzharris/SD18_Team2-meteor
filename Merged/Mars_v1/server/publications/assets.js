import {Meteor} from "meteor/meteor";

Meteor.publish('nodes', function() {
    return Nodes.find();
});

Meteor.publish('tags', function() {
    return Tags.find();
});
