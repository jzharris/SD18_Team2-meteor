Template.dashboardContent.helpers({
    totalStorage : function() {
        return ((Nodes.find().count() + Tags.find().count())*64 / (500 * 1000 * 8) * 100).toFixed(3);
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
    }
});