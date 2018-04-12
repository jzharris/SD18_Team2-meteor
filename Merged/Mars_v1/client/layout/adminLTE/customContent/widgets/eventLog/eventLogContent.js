Template.eventLogContent.helpers({
  nodeListFull: function () {
    return Nodes.find({});
  },

  groupedNodes: function () {
      return SortedNodes.find({});
  },
});
