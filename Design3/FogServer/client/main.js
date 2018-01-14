import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

// Items = new Mongo.Collection('items');
window.Items = Items;

let blackColor = '#000000';
let cloudColor = '#314bb9';
let fogColor = '#1a9e0b';

Template.list.onCreated(function() {
    Meteor.subscribe('myitems');
    Meteor.subscribe('status');

    Meteor.subscribe('timing');
});


Template.list.events({
    'click a.delete': function() {
        Items.remove(this._id);
    },
    'click a.add': function() {
        Items.insert({start: Date.now()});
    },
    // 'click a.start': function() {
    //     Items.update(this._id, {$set: {start: Date.now()}});
    // },
    // 'click a.end': function() {
    //     Items.update(this._id, {$set: {end: Date.now()}});
    // },

    'click a.disconnect': function() {
        Meteor.call('disconnect');
    },
    'click a.reconnect': function() {
        Meteor.call('reconnect');
    },
    'click a.reset': function() {
        Meteor.call('reset');
    }
});

Template.list.helpers({
    items() {
        return Items.find();
    },
    getSent() {
        const timing = Timing.findOne({sync : this._id});
        return timing ? timing.sent : '?';
    },
    getReceived() {
        const timing = Timing.findOne({sync : this._id});
        return timing ? timing.received : '?';
    },
    getOrigin() {
        const timing = Timing.findOne({sync : this._id});
        return timing ? (timing.origin === 'cloud' ? cloudColor : fogColor) : blackColor;
    },
    dt() {
        const timing = Timing.findOne({sync : this._id});
        if(timing && timing.sent && timing.received) {
            return timing.received - timing.sent;
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
        let cloud = Timing.find({origin : 'cloud'}).fetch();
        console.log(cloud);
        for(let t in cloud) {
            if(cloud[t].received && cloud[t].sent) {
                let dt = cloud[t].received - cloud[t].sent;
                console.log(dt);
                sum += dt;
                i++;
            }
        }
        console.log('avg: '+(sum / i));
        return i > 0 ? sum / i : 0;
    },
    fogAvg() {
        let sum = 0, i = 0;
        let fog = Timing.find({origin : 'fog'}).fetch();
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