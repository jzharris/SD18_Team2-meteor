import {Meteor} from "meteor/meteor";

Meteor.startup(() => {
    // code to run on server at startup

    if(GUI.find().count() > 0) {
        GUI.update({_id : GUI.findOne()._id}, {waitTime: 1500});
    } else {
        GUI.insert({waitTime: 1500});
    }

});