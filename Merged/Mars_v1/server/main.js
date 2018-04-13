import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  // code to run on server at startup

    Nodes.find().observe({

      added: function(document) {
        groupNodesByID();
      },

      changed: function(newDocument, oldDocument) {
        groupNodesByID();
      },

      removed: function(oldDocument) {
        groupNodesByID();
      }
    });

    Tags.find().observe({

      added: function(document) {
        groupTagsByID();
      },

      changed: function(newDocument, oldDocument) {
        //groupTagsByID();
      },

      removed: function(oldDocument) {
        //console.log(oldDocument.tagID);
        groupTagsByID();
      }
    });
});
// ================================================
// Database filtering functions
function groupNodesByID() {
  // Group all documented node packets by nodeID
    var nodeIDs = Nodes.aggregate([
        {$sort: {"gps.timestamp": -1}},
        { $group: {
          // Group by matching nodeID
          _id: "$nodeID",

          // Count number of matching docs for the group
          count: { $sum:  1 },

          gps: {$push: "$gps"}

      }},
      {$sort: {"gps.timestamp": -1}},
      {$out: 'sortedNodes'}
    ]);
    //console.log(SortedNodes.find())
    // creates a document for each nodes
    // the documents include the following fields
    // _id: Group criteria, i.e nodeID
    // count: Number of documents with the same nodeID
    // gps: The gps data of the node including lat, long, and timestamp
}

function groupTagsByID() {
  // Group all documented node packets by nodeID
    var tagIDs = Tags.aggregate([

        { $group: {
          // Group by matching nodeID
          _id: "$tagID",

          nodeID: {$addToSet: "$nodeID"},

          // Count number of matching docs for the group
          count: { $sum:  1 },

          measurements: {$push: "$measurements"},

      }},
      { $addFields:{ "pos": []}},
      {$out: 'sortedTags'}
    ]);
    //console.log(tagIDs);
    SortedTags.find({}).map(function(x){
        var position = triangulate(x.nodeID);
        SortedTags.update( { _id: x._id },{$push: {pos: position}});
    });
    //console.log(tagIDs)
    //console.log(SortedTags.find());
    // creates a document for each tag
    // the documents include the following fields
    // _id: Group criteria, i.e tagID
    // nodeID: List of nodes that reported this tag
    // count: Number of documents with the same tagID
    // pos: The triangulated position of the tag, and the time that the position
    //      was calculated.
}
