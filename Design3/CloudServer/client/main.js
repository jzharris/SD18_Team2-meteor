import { Template } from 'meteor/templating';

import './main.html';

window.Items = Items;

Template.list.onCreated(function() {
    Meteor.subscribe('items');
});

Template.list.events({
    'click a.delete': function() {
        Items.remove(this._id);
    },
    'click a.add': function() {
        Items.insert({start: Date.now()});
    },
});

Template.list.helpers({
    items() {
        return Items.find();
    },
});