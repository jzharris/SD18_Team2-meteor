import { Meteor } from 'meteor/meteor';

// MASTER

Meteor.startup(() => {
    // code to run on server at startup
    console.log(Items.find().count());
    Meteor.publish("items", function(date) {
        // if a date is given it is interpreted as a "minimum" date, only
        // newer items shown
        if (date) {
            return Items.find({start: {$gt: date}});
        } else {
            return Items.find();
        }
    });
});

Meteor.methods({
    'reset': function() {
        Items.remove({});
    }
});