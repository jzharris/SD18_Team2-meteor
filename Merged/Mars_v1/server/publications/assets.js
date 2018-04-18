import {Meteor} from "meteor/meteor";

Meteor.publish('nodes', function() {
    return Nodes.find();
});

Meteor.publish('tags', function() {
    return Tags.find();
});

Meteor.publish('sortedNodes', function() {
    return SortedNodes.find();
});

Meteor.publish('sortedTags', function() {
    return SortedTags.find();
});

Meteor.publish('status', function() {
    return Status.find();
});