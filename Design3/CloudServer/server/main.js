import { Meteor } from 'meteor/meteor';

// MASTER

Meteor.startup(() => {
    // code to run on server at startup

    Meteor.publish('nodes', function() {
        return Nodes.find();
    });

    Meteor.publish('tags', function() {
        return Tags.find();
    });
});

Meteor.methods({
    'resetNodes': function() {
        Nodes.remove({});
    },
    'resetTags': function() {
        Tags.remove({});
    },
});