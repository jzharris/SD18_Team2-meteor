import { Meteor } from 'meteor/meteor';
import ServerSyncClient from 'meteor/chfritz:serversync';

// SLAVE
// *with* serversync package

a = null;
let sentLog = {};

Meteor.startup(() => {
    // code to run on server at startup

    Meteor.publish('items', function() {
        return Items.find();
    });

    Status.remove({});
    Status.insert({
        _id: "connection",
        connected: false
    });
    Meteor.publish('status', function() {
        return Status.find();
    });

    a = new ServerSyncClient(Meteor.settings.host, {
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
    a.sync('items', {
        // mode: "read",
        mode: "write",
        collection: Items,
        onReady: function() {
            const coll = a.getCollection('items');
            console.log("ready", coll.find().count());
        },
        beforeSyncUp: function(type, id, doc) {
            console.log("beforeSyncUp", type, id, doc);
            if(doc && doc.hasOwnProperty('sent') && doc.hasOwnProperty('received')) {
                //updating internal times, do nothing
            } else {
                //new item, log time
                sentLog[id] = Date.now();
            }
        },
        beforeSyncDown: function(type, id, doc) {
            console.log("beforeSyncDown", type, id, doc);
            if(doc && doc.hasOwnProperty('sent') && doc.hasOwnProperty('received')) {
                //updating internal times, do nothing
            } else {
                //new item, log time
                sentLog[id] = Date.now();
            }
        },
        afterSyncUp: function(type, id, doc) {
            console.log("afterSyncUp", type, id, doc);
            if(sentLog[id]) {
                const sentDate = sentLog[id];
                delete sentLog[id];
                Items.update({_id : id}, {$set : {sent: sentDate, received: Date.now(), origin: 'fog'}});
            }
        },
        afterSyncDown: function(type, id, doc) {
            console.log("afterSyncDown", type, id, doc);
            if(sentLog[id]) {
                const sentDate = sentLog[id];
                delete sentLog[id];
                Items.update({_id : id}, {$set : {sent: sentDate, received: Date.now(), origin: 'cloud'}});
            }
        },

        // args: [Date.now()] // testing selective publications: only get
        // items newer than our start time
    });
});


Meteor.methods({
    'disconnect': function() {
        console.log("try to disconnect");
        a._connection.disconnect();
        Status.update("connection", {
            connected: false
        });
    },
    'reconnect': function() {
        console.log("try to reconnect");
        a._connection.reconnect();
        Status.update("connection", {
            connected: true
        });
    },
    'reset': function() {
        Items.remove({});
    }
});