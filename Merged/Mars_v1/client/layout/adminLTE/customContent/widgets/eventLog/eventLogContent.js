import { Session } from 'meteor/session'

Template.eventLogContent.helpers({
  listcontent: function() {
    // var nodedata = SortedNodes.find({},{sort: {"lastupdate": -1}}).map(function(node){
    //
    //   node.lastupdate = time_diff(node.lastupdate);
    //
    //   node.pos.map(function(x,index) {
    //     node.pos[index].timestamp = formatDate(x.timestamp);
    //   })
    //
    //   return node;
    // })
    //
    // var tagdata = SortedTags.find({},{sort: {"lastupdate": -1}}).map(function(tag){
    //
    //   tag.lastupdate = time_diff(tag.lastupdate);
    //
    //   tag.pos.map(function(x,index) {
    //     tag.pos[index].timestamp = formatDate(x.timestamp);
    //   })
    //
    //   return tag;
    // })
    // console.log(tagdata)

  }
});

Template.nodelist.events({
  'click .interrogateNode': function() {
    interrogate(this._id);
  }
});

Template.nodelist.helpers({
  groupedNodes: function () {
      var nodedata = SortedNodes.find({},{sort: {"lastupdate": -1}}).map(function(node){

        node.lastupdate = time_diff(node.lastupdate);

        node.pos.map(function(x,index) {
          node.pos[index].timestamp = formatDate(x.timestamp);
        })

        return node;
      })

      //console.log(nodedata)

      return nodedata;
  }
});

Template.taglist.helpers({
  groupedTags: function () {
    var tagdata = SortedTags.find({},{sort: {"lastupdate": -1}}).map(function(tag){

      tag.lastupdate = time_diff(tag.lastupdate);
      tag.pos.timestamp = formatDate(tag.pos.timestamp);

      console.log(tag)
      return tag;
    })
    console.log(tagdata)
    return tagdata;

  }
});
