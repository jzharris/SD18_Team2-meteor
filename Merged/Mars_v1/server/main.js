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

          pos: {$push: "$gps"}
      }},

      {$project: {
        "count": 1,
        "pos": 1,
        "lastupdate": {$arrayElemAt: [{ $map: {
            input: "$pos",
            as: "p",
            in: "$$p.timestamp"
            }
         }, 0]}
      }},
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
        "lat": {$arrayElemAt: [{ $arrayElemAt: [ "$pos.pos.lat", 0 ] }, 0]},
        "lon": {$arrayElemAt: [{ $arrayElemAt: [ "$pos.pos.lon", 0 ] }, 0]},
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
        "count": 1,
        "measurements": 1,
        "pos.lat": "$lat",
        "pos.lon": "$lon",
        "pos.timestamp": new Date(),
        "lastupdate": new Date()
      }},

      {$out: 'sortedTags'}
    ])

    // creates a document for each tag
    // the documents include the following fields
    // _id: Group criteria, i.e tagID
    // nodeID: List of nodes that reported this tag
    // count: Number of documents with the same tagID
    // pos: The triangulated position of the tag, and the time that the position
    //      was calculated.
}
