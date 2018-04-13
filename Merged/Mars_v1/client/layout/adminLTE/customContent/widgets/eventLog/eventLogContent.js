Template.eventLogContent.helpers({

});

Template.nodelist.helpers({
  groupedNodes: function () {

      return SortedNodes.find({});
  }
});

Template.taglist.helpers({
  groupedTags: function () {

      return SortedTags.find({});

  }
});
