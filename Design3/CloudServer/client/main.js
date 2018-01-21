import { Template } from 'meteor/templating';

import './main.html';


let blackColor = '#000000';
let cloudColor = '#314bb9';
let fogColor = '#1a9e0b';

Template.list.onCreated(function() {
    Meteor.subscribe('nodes');
});

Template.list.events({
    'click div.delete': function() {
        Nodes.remove(this._id);
    },
    'click div.add': function() {
        Nodes.insert(node());
    },

    'click div.reset': function() {
        Meteor.call('reset');
    },
});

Template.list.helpers({
    inLog() {
        return Nodes.findOne({sent: {$exists : true}});
    },
    items() {
        return Nodes.find({sent: {$exists : true}}, {sort: {sent: 1}});
    },
    inQueue() {
        return Nodes.findOne({sent: {$exists : false}});
    },
    waiting() {
        return Nodes.find({sent: {$exists : false}});
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
        return i > 0 ? sum / i : 0;
    },
});