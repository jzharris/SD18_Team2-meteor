import { Template } from 'meteor/templating';

import './main.html';

let blackColor = '#000000';
let cloudColor = '#314bb9';
let fogColor = '#1a9e0b';

Template.list.onCreated(function() {
    Meteor.subscribe('status');
    Meteor.subscribe('nodes');
    Meteor.subscribe('tags');

    //start sending data every minute
    Meteor.setInterval(function() {

        console.log("inserting");
        Nodes.insert(node());

        // if(Random.fraction() < 0.1) {
        //     console.log('tag event!');
        //     Tags.insert(tag());
        // }

    }, 60000);
});


Template.list.events({
    'click div.addNode': function() {
        Nodes.insert(node());
    },
    'click div.resetNode': function() {
        Meteor.call('resetNodes');
    },

    'click div.addTag': function() {
        Tags.insert(tag());
    },
    'click div.resetTag': function() {
        Meteor.call('resetTags');
    },

    'click div.disconnect': function() {
        Meteor.call('disconnect');
    },
    'click div.reconnect': function() {
        Meteor.call('reconnect');
    },
});

Template.list.helpers({

    nodeInLog() {
        return Nodes.findOne({sent: {$exists : true}});
    },
    nodesInLog() {
        return Nodes.find({sent: {$exists : true}}, {sort: {sent: 1}});
    },
    nodeInQueue() {
        return Nodes.findOne({sent: {$exists : false}});
    },
    nodesInQueue() {
        return Nodes.find({sent: {$exists : false}});
    },

    tagInLog() {
        return Tags.findOne({sent: {$exists : true}});
    },
    tagsInLog() {
        return Tags.find({sent: {$exists : true}}, {sort: {sent: 1}});
    },
    tagInQueue() {
        return Tags.findOne({sent: {$exists : false}});
    },
    tagsInQueue() {
        return Tags.find({sent: {$exists : false}});
    },


    getOrigin() {
        return this.origin ? (this.origin === 'cloud' ? cloudColor : fogColor) : blackColor;
    },
    dt() {
        if(this.sent && this.received) {
            return this.received - this.sent;
        } else {
            return 'waiting';
        }
    },

    getCloudColor() {
        return cloudColor;
    },
    getFogColor() {
        return fogColor;
    },

    cloudAvg() {
        let sum = 0, i = 0;
        let cloud = Nodes.find({origin: 'cloud'}).fetch();
        for(let t in cloud) {
            if(cloud[t].received && cloud[t].sent) {
                let dt = cloud[t].received - cloud[t].sent;
                sum += dt;
                i++;
            }
        }

        cloud = Tags.find({origin: 'cloud'}).fetch();
        for(let t in cloud) {
            if(cloud[t].received && cloud[t].sent) {
                let dt = cloud[t].received - cloud[t].sent;
                sum += dt;
                i++;
            }
        }

        return i > 0 ? sum / i : 0;
    },
    fogAvg() {
        let sum = 0, i = 0;
        let fog = Nodes.find({origin : 'fog'}).fetch();
        for(let t in fog) {
            if(fog[t].received && fog[t].sent) {
                sum += fog[t].received - fog[t].sent;
                i++;
            }
        }

        fog = Tags.find({origin : 'fog'}).fetch();
        for(let t in fog) {
            if(fog[t].received && fog[t].sent) {
                sum += fog[t].received - fog[t].sent;
                i++;
            }
        }

        return i > 0 ? sum / i : 0;
    },

    connected() {
        const status = Status.findOne("connection");
        return (status && status.connected);
    },
});