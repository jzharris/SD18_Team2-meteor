import { Meteor } from 'meteor/meteor';
import ServerSyncClient from 'meteor/chfritz:serversync';

// SLAVE
// *with* serversync package

a = null;

Meteor.startup(() => {
    // code to run on server at startup

    Meteor.publish('myitems', function() {
        return Items.find();
    });

    Meteor.publish('timing', function() {
        return Timing.find();
    });

    Status.remove({});
    Status.insert({
        _id: "connection",
        connected: false
    });
    Meteor.publish('status', function() {
        return Status.find();
    });

    a = new ServerSyncClient("https://heroku-cloud3.herokuapp.com/", { //"http://localhost:3000"
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

    b = new ServerSyncClient("http://localhost:3000", { //"https://heroku-cloud3.herokuapp.com/"
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
            if(!Timing.findOne({sync : id}) && type !== 'remove') {
                Timing.insert({sync: id, sent: Date.now(), received: null, origin: 'flog'});
            }
        },
        beforeSyncDown: function(type, id, doc) {
            console.log("beforeSyncDown", type, id, doc);
            if(!Timing.findOne({sync : id}) && type !== 'remove') {
                Timing.insert({sync: id, sent: Date.now(), received: null, origin: 'cloud'});
            }
        },
        afterSyncUp: function(type, id, doc) {
            console.log("afterSyncUp", type, id, doc);
            const timing = Timing.findOne({sync : id});
            if(timing && timing.end == null && type !== 'remove') {
                Timing.update({sync : id}, {$set : {received : Date.now(), origin: 'fog'}});
            }
        },
        afterSyncDown: function(type, id, doc) {
            console.log("afterSyncDown", type, id, doc);
            const timing = Timing.findOne({sync : id});
            if(timing && timing.end == null && type !== 'remove') {
                Timing.update({sync : id}, {$set : {received : Date.now(), origin: 'cloud'}});
            }
        },

        // args: [Date.now()] // testing selective publications: only get
        // items newer than our start time
    });

    b.sync('timing', {
        mode: "write",
        collection: Timing,
        onReady: function() {
            const coll = a.getCollection('items');
            console.log("ready", coll.find().count());
        },
        beforeSyncUp: function(type, id, doc) {
            console.log("beforeSyncUp", type, id, doc);
        },
        beforeSyncDown: function(type, id, doc) {
            console.log("beforeSyncDown", type, id, doc);
        },
        afterSyncUp: function(type, id, doc) {
            console.log("afterSyncUp", type, id, doc);
        },
        afterSyncDown: function(type, id, doc) {
            console.log("afterSyncDown", type, id, doc);
        },
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
        Timing.remove({});
        Items.remove({});
    }
});