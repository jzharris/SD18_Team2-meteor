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
        SortedNodes.remove(oldDocument.nodeID);
      }
    });

    Tags.find().observe({

      added: function(document) {
        groupTagsByID();
      },

      changed: function(newDocument, oldDocument) {
        groupTagsByID();
      },

      removed: function(oldDocument) {
        //console.log('removed: ' + oldDocument.tagID);
        SortedTags.remove(oldDocument.tagID);
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
      //{$set: {nodelist: "$"}}
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
    Tags.aggregate([
      {$lookup:
        {
          from: "sortedNodes",
          localField: "nodeID",
          foreignField: "_id",
          as: "pos"
        }
      },
      {$project: {
        "tagID": 1,
        "nodeID": 1,
        "measurements": 1,
        "lat": {$arrayElemAt: [{ $arrayElemAt: [ "$pos.gps.lat", 0 ] }, 0]},
        "lon": {$arrayElemAt: [{ $arrayElemAt: [ "$pos.gps.lon", 0 ] }, 0]},
      }},

      { $group: {
          // Group by matching nodeID
          _id: "$tagID",

          nodeID: {$addToSet: "$nodeID"},

          // Count number of matching docs for the group
          count: { $sum:  1 },

          measurements: {$push: "$measurements"},

          lat: {$avg: "$lat"},

          lon: {$avg: "$lon"}
      }},

      {$project: {
        "tagID": 1,
        "nodeID": 1,
        "measurements": 1,
        "pos.lat": "$lat",
        "pos.lon": "$lon",
        "pos.timestamp": new Date()
      }},
      {$out: 'sortedTags'}
    ])
    // .forEach(function(tagGroup){
    //
    //   SortedTags.find({}).forEach(function(tag) {
    //     var prevPos = tag.pos; // Previous list of positions
    //     var node_sel = tagGroup.data.nodeID; // List of nodes that reported seeing this tag
    //
    //     // Check if tag already has a list of positions
    //     if (typeof prevPos !== 'undefined'){
    //       // Tag instance already has a position field
    //       // Append latest position to previous position list
    //       prevPos.push(triangulate(node_sel));
    //       // Update current position list
    //       tagGroup.data.pos = prevPos;
    //
    //     } else {
    //       // Tag instance does not have a position field
    //       // Create a new position list
    //       tagGroup.data.pos.push(triangulate(node_sel));
    //     }
    //   });
    //
    //   // console.log('\nNew\n')
    //   // console.log(tagGroup.data.pos)
    //   // console.log('\n\n')
    //   SortedTags.update({_id: tagGroup._id},tagGroup.data, {upsert: true});
    // });

    // groupedTags.forEach(function(tag){
    //
    //
    //
    // });
    //console.log(tagIDs);
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
