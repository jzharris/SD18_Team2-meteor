import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
  // code to run on server at startup

    Nodes.find().observe({

      added: function(document) {
        //console.log('[ADDED] New data packet for Node ' + document.nodeID)
        groupNodesbyID();
      },

      changed: function(newDocument, oldDocument) {
        var id = newDocument.nodeID.toString();
        //console.log('[CHANGED] Packet for Node ' + id + ' changed')
        groupNodesbyID();
      },

      removed: function(oldDocument) {
        var id = oldDocument.nodeID.toString();
        //console.log('[REMOVED] Packet for Node ' + id + ' removed')
        SortedNodes.remove(id);
      }
    });

    Tags.find().observe({

      added: function(document) {
        //console.log('[ADDED] New data packet for Tag ' + document.tagID)
        groupTagsbyID();
      },

      changed: function(newDocument, oldDocument) {
        var id = newDocument.tagID.toString();
        //console.log('[CHANGED] Packet for Tag ' + id + ' changed')
        groupTagsbyID();
      },

      removed: function(oldDocument) {
        var id = oldDocument.tagID.toString();
        //console.log('[REMOVED] Packet for Tag ' + id + ' removed')
        SortedTags.remove(id);
      }
    });

});
// ================================================
// Database filtering functions
function groupNodesbyID() {
  // Group all documented node packets by nodeID
  //console.log("[AGGREGATE] Grouping nodes and formating collection for client")
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
    ]);

    nodeIDs.forEach(function(node){
      node._id = node._id.toString();
      // console.log("[AGGREGATE] Sorted Documents:")
      // console.log(node)
      SortedNodes.upsert({_id: node._id},node,{upsert: true});

    });
    // console.log("[AGGREGATE] Collection updated: SortedNodes")
    // console.log(SortedNodes.find({}).fetch())
  // Group all documented node packets by nodeID
  //console.log("[AGGREGATE] Grouping tags and formating collection for client")
}
function groupTagsbyID() {
    var tagIDs = Tags.aggregate([
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
        "tagtime": "$sent",
        "lat": {$arrayElemAt: [{ $arrayElemAt: [ "$pos.pos.lat", 0 ] }, 0]},
        "lon": {$arrayElemAt: [{ $arrayElemAt: [ "$pos.pos.lon", 0 ] }, 0]},
        "nodetime": {$arrayElemAt:["$pos.lastupdate",0]},
      }},
      //{$match: {dateComp: 1}},

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
        "measurements": {$arrayElemAt: ["$measurements", 0]},
        "pos.lat": "$lat",
        "pos.lon": "$lon",
        "pos.timestamp": new Date(),
        "lastupdate": new Date()
      }},
    ]);
    tagIDs.forEach(function(tag){
      tag._id = tag._id.toString();
      // console.log("[AGGREGATE] Sorted Documents:")
      // console.log(tag)
      SortedTags.upsert({_id: tag._id},tag,{upsert: true});

    });
    // console.log("[AGGREGATE] Collection updated: SortedTags")
    // console.log(SortedTags.find({}).fetch())

    // creates a document for each tag
    // the documents include the following fields
    // _id: Group criteria, i.e tagID
    // nodeID: List of nodes that reported this tag
    // count: Number of documents with the same tagID
    // pos: The triangulated position of the tag, and the time that the position
    //      was calculated.
}
