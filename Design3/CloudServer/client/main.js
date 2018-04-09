import { Template } from 'meteor/templating';
import { Random } from 'meteor/random';

import './main.html';

let blackColor = '#000000';
let cloudColor = '#314bb9';
let fogColor = '#1a9e0b';

Template.list.onCreated(function() {
    Meteor.subscribe('nodes');
    Meteor.subscribe('tags');
    Meteor.subscribe('gui');

    //start sending data every minute
    addMeasurement(GUI.findOne() ? GUI.findOne().waitTime : 1500)
});

addMeasurement = function(waitTime) {
    Meteor.setTimeout(function() {

        const nd = node();
        Nodes.insert(nd, function(err, result) {
            if(result) {
                Nodes.update({_id : result}, {$set : {received: Date.now()}});
            }
        });

        //10 tag events
        for (let i = 0; i < 10; i++) {
            const tagID = Random.id();
            Tags.insert(tag(nd.nodeID, tagID), function(err, result) {
                if(result) {
                    Tags.update({_id : result}, {$set : {received: Date.now()}});
                }
            });
        }

        addMeasurement(GUI.findOne() ? GUI.findOne().waitTime : 1500);

    }, waitTime);
};

Template.list.events({
    'click div.addNode': function() {
        Nodes.insert(node());
    },
    'click div.resetNode': function() {
        Meteor.call('resetNodes');
    },

    'click div.addTag': function() {
        Tags.insert(tag('cloud', 'cloud'));
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

    'click div.downloadCloud': function() {
        if(dataPresent('cloud')) {
            let nameFile = 'cloudData.csv';
            Meteor.call('downloadCSV', 'cloud', function(err, fileContent) {
                if(fileContent){
                    let blob = new Blob([fileContent], {type: "text/plain;charset=utf-8"});
                    saveAs(blob, nameFile);
                }
            });
        }
    },
    'click div.downloadFog': function() {
        if(dataPresent('fog')) {
            let nameFile = 'fogData.csv';
            Meteor.call('downloadCSV', 'fog', function(err, fileContent) {
                if(fileContent){
                    let blob = new Blob([fileContent], {type: "text/plain;charset=utf-8"});
                    saveAs(blob, nameFile);
                }
            });
        }
    },

    'change #waitTime': function (evt) {
        console.log(evt.target.valueAsNumber);
        GUI.update({_id : GUI.findOne()._id}, {waitTime : evt.target.valueAsNumber});
    }
});

Template.list.helpers({

    nodeInLog() {
        return Nodes.findOne({sent: {$exists : true}});
    },
    nodesInLog() {
        return Nodes.find({sent: {$exists : true}}, {sort: {sent: -1}, limit: 10});
    },
    nodeCount() {
        return Nodes.find({sent: {$exists : true}}).count();
    },
    nodeInQueue() {
        return Nodes.findOne({sent: {$exists : false}});
    },
    nodesInQueue() {
        return Nodes.find({sent: {$exists : false}});
    },

    tagInQueue() {
        return Tags.findOne({sent: {$exists : false}});
    },
    tagsInQueue() {
        return Tags.find({sent: {$exists : false}});
    },
    tagInLog() {
        return Tags.findOne({sent: {$exists : true}});
    },
    tagsInLog() {
        const tags = Tags.find({sent: {$exists : true}}, {sort: {sent: -1}, limit: 10}).fetch();
        sorted = [];

        for(let t in tags) {
            let index = sorted.map(function(x) {return x[0].tagID;}).indexOf(tags[t].tagID);
            if(index === -1) {
                sorted.push([tags[t]]);
            } else {
                sorted[index].push(tags[t]);
            }
        }

        return sorted;
    },
    tagCount() {
        return Tags.find({sent: {$exists : true}}).count();
    },
    getNodeID() {
        return this[0].nodeID;
    },
    getTagID() {
        return this[0].tagID;
    },
    getGroupSize() {
        return this.length;
    },
    getTagDt() {
        const tags = this;

        let sum = 0, i = 0;
        for(let t in tags) {
            if(tags[t].received && tags[t].sent) {
                sum += tags[t].received - tags[t].sent;
                i++;
            }
        }

        return i > 0 ? sum / i : 0;
    },
    getTagOrigin() {
        return this[0].origin ? (this[0].origin === 'cloud' ? cloudColor : fogColor) : blackColor;
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

    cloudPresent() {
        return dataPresent('cloud') ? '' : 'disabled';
    },
    fogPresent() {
        return dataPresent('fog') ? '' : 'disabled';
    },
    cloudAvg() {
        let sum = 0, i = 0;
        let cloud = Nodes.find({}).fetch();
        for(let t in cloud) {
            if(cloud[t].received && cloud[t].sent) {
                let dt = cloud[t].received - cloud[t].sent;
                sum += dt;
                i++;
            }
        }

        cloud = Tags.find({}).fetch();
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

    waitTime() {
        return GUI.findOne().waitTime;
    },
});