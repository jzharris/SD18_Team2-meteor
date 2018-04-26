Template.dashboardContent.helpers({
    totalStorage : function() {
        return ((Nodes.find().count()*64 + Tags.find().count()*16) / (500 * 1000 * 8) * 100).toFixed(3);
    },
    totalBytes : function() {
        return ((Nodes.find().count()*64 + Tags.find().count()*16) / 1000).toFixed(1);
    },
    nodeCount : function() {
        return SortedNodes.find().count();
    },
    pluralNodes: function () {
        return SortedNodes.find().count() > 1 ? 's' : '';
    },
    tagCount : function() {
        return SortedTags.find().count();
    },
    pluralTags: function () {
        return SortedTags.find().count() > 1 ? 's' : '';
    },
    recentNodes: function() {
        return Nodes.find({}, {limit: 4, sort: {'gps.timestamp': -1}}).fetch();
    },
    croppedLat: function() {
        return this.gps.lat ? (this.gps.lat).toFixed(5) : null;
    },
    croppedLon: function() {
        return this.gps.lon ? (this.gps.lon).toFixed(5) : null;
    },
    recentTags: function() {
        return Tags.find({}, {limit: 4}).fetch();
    }
});