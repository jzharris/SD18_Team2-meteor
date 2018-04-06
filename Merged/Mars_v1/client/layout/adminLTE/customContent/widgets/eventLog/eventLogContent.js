Template.eventLogContent.helpers({
  nodeListFull: function () {
    return Nodes.find({});
  },

  groupNodesByID: function () {

    Meteor.call('groupNodesByID',function (error, result){})
  },

  // nodeInstances: function (node) {
  //   console.log(Nodes.find({}));
  //   return Nodes.find({});
  // },
  // icons = {
  //     tag: {
  //       name: 'Tag',
  //       default: new Icon('Tag','LimeGreen'),
  //       selected: new Icon('Tag','LightBlue'),
  //       alert: new Icon('Tag','OrangeRed')
  //     },
  //     node: {
  //       name: 'Node',
  //       default: new Icon('Node','LimeGreen'),
  //       selected: new Icon('Node','LightBlue'),
  //       alert: new Icon('Node','OrangeRed')
  //     }
  // }

});
