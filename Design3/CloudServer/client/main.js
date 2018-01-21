import { Template } from 'meteor/templating';

import './main.html';

window.Items = Items;

let blackColor = '#000000';
let cloudColor = '#314bb9';
let fogColor = '#1a9e0b';

Template.list.onCreated(function() {
    Meteor.subscribe('items');
});

Template.list.events({
    'click div.delete': function() {
        Items.remove(this._id);
    },
    'click div.add': function() {
        Items.insert({data: 0});
    },

    'click div.reset': function() {
        Meteor.call('reset');
    },
});

Template.list.helpers({
    inLog() {
        return Items.findOne({sent: {$exists : true}});
    },
    items() {
        return Items.find({sent: {$exists : true}}, {sort: {sent: 1}});
    },
    inQueue() {
        return Items.findOne({sent: {$exists : false}});
    },
    waiting() {
        return Items.find({sent: {$exists : false}});
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
        let cloud = Items.find({origin: 'cloud'}).fetch();
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
        let fog = Items.find({origin : 'fog'}).fetch();
        for(let t in fog) {
            if(fog[t].received && fog[t].sent) {
                sum += fog[t].received - fog[t].sent;
                i++;
            }
        }
        return i > 0 ? sum / i : 0;
    },
});