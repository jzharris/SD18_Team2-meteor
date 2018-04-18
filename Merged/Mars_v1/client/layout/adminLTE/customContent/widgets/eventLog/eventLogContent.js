import { Session } from 'meteor/session'

Template.eventLogContent.helpers({
  listcontent: function() {
    // var nodelist = SortedNodes.find({}).fetch();
    // console.log(nodelist)
    // console.log('\n\n')
    // var taglist = SortedTags.find({},{sort: {}}).fetch();
    // console.log(taglist)
    // console.log('\n\n')

    // var  out = [
    //   {title: 'Nodes', count: SortedNodes.count({}), list: SortedNodes.find({})},
    //   {title: 'Tags', count: SortedTags.count({}), list: SortedTags.find({})}
    // ]
    //console.log(nodesCount)
    //return out;
  }
});

Template.nodelist.helpers({
  groupedNodes: function () {
      var nodedata = SortedNodes.find({}).map(function(node){

        node.lastupdate = time_diff(node.pos[0].timestamp);

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

      return SortedTags.find({});

  }
});
