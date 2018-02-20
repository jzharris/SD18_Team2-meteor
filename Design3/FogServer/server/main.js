import { Meteor } from 'meteor/meteor';
import ServerSyncClient from 'meteor/chfritz:serversync';

// SLAVE
// *with* serversync package

link = null;
let nodeLog = {};
let tagLog = {};

Meteor.startup(() => {
    // code to run on server at startup

    Status.remove({});
    Status.insert({
        _id: "connection",
        connected: false
    });
    Meteor.publish('status', function() {
        return Status.find();
    });

    Meteor.publish('nodes', function() {
        return Nodes.find();
    });
    Meteor.publish('tags', function() {
        return Tags.find();
    });

    link = new ServerSyncClient(Meteor.settings.host ? Meteor.settings.host : "http://localhost:3000", {
        onConnect: function() {
            console.log("connected to master");
        },
        onReconnect: function() {
            console.log("reconnected to master");
        },
        beforeSyncDirty: function(count) {
            console.log("beforeSyncDirty", count);
        },
        afterSyncDirty: function(count) {
            console.log("afterSyncDirty", count);
        }
    });

    Status.update("connection", {
        connected: true
    });

    console.log("sync");
    link.sync('nodes', {
        // mode: "read",
        mode: "write",
        collection: Nodes,
        onReady: function() {
            const coll = link.getCollection('nodes');
            console.log("ready", coll.find().count());
        },
        beforeSyncUp: function(type, id, doc) {
            console.log("beforeSyncUp", type, id, doc);
            if(type === 'remove') {
                //removing item, do nothing else
            } else if(doc && doc.hasOwnProperty('sent') && doc.hasOwnProperty('received')) {
                //updating internal times, do nothing
            } else {
                //new item, log time
                nodeLog[id] = Date.now();
            }
        },
        beforeSyncDown: function(type, id, doc) {
            console.log("beforeSyncDown", type, id, doc);
            if(type === 'remove') {
                //removing item, do nothing else
            } else if(doc && doc.hasOwnProperty('sent') && doc.hasOwnProperty('received')) {
                //updating internal times, do nothing
            } else {
                //new item, log time
                nodeLog[id] = Date.now();
            }
        },
        afterSyncUp: function(type, id, doc) {
            console.log("afterSyncUp", type, id, doc);
            if(nodeLog[id]) {
                const sentDate = nodeLog[id];
                delete nodeLog[id];
                Nodes.update({_id : id}, {$set : {sent: sentDate, received: Date.now(), origin: 'fog'}});
            }
        },
        afterSyncDown: function(type, id, doc) {
            console.log("afterSyncDown", type, id, doc);
            if(nodeLog[id]) {
                const sentDate = nodeLog[id];
                delete nodeLog[id];
                Nodes.update({_id : id}, {$set : {sent: sentDate, received: Date.now(), origin: 'cloud'}});
            }
        },
    });

    link.sync('tags', {
        // mode: "read",
        mode: "write",
        collection: Tags,
        onReady: function() {
            const coll = link.getCollection('tags');
            console.log("ready", coll.find().count());
        },
        beforeSyncUp: function(type, id, doc) {
            console.log("beforeSyncUp", type, id, doc);
            if(type === 'remove') {
                //removing item, do nothing else
            } else if(doc && doc.hasOwnProperty('sent') && doc.hasOwnProperty('received')) {
                //updating internal times, do nothing
            } else {
                //new item, log time
                tagLog[id] = Date.now();
            }
        },
        beforeSyncDown: function(type, id, doc) {
            console.log("beforeSyncDown", type, id, doc);
            if(type === 'remove') {
                //removing item, do nothing else
            } else if(doc && doc.hasOwnProperty('sent') && doc.hasOwnProperty('received')) {
                //updating internal times, do nothing
            } else {
                //new item, log time
                tagLog[id] = Date.now();
            }
        },
        afterSyncUp: function(type, id, doc) {
            console.log("afterSyncUp", type, id, doc);
            if(tagLog[id]) {
                const sentDate = tagLog[id];
                delete tagLog[id];
                Tags.update({_id : id}, {$set : {sent: sentDate, received: Date.now(), origin: 'fog'}});
            }
        },
        afterSyncDown: function(type, id, doc) {
            console.log("afterSyncDown", type, id, doc);
            if(tagLog[id]) {
                const sentDate = tagLog[id];
                delete tagLog[id];
                Tags.update({_id : id}, {$set : {sent: sentDate, received: Date.now(), origin: 'cloud'}});
            }
        },
    });
});


Meteor.methods({
    'disconnect': function() {
        console.log("try to disconnect");
        link._connection.disconnect();

        Status.update("connection", {
            connected: false
        });
    },
    'reconnect': function() {
        console.log("try to reconnect");
        link._connection.reconnect();

        Status.update("connection", {
            connected: true
        });
    },
    'resetNodes': function() {
        Nodes.remove({});
    },
    'resetTags': function() {
        Tags.remove({});
    },
});