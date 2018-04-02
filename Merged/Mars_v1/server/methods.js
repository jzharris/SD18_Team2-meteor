import { Meteor } from 'meteor/meteor';

Meteor.methods({
    'resetNodes': function() {
        Nodes.remove({});
    },
    'resetTags': function() {
        Tags.remove({});
    },

    'downloadCSV': function(origin) {
        const collection = collectAssets(origin);
        const heading = true;  // Optional, defaults to true
        const delimiter = ","; // Optional, defaults to ",";
        console.log(exportcsv.exportToCSV(collection, heading, delimiter));
        return exportcsv.exportToCSV(collection, heading, delimiter);
    },
// ================================================
// Database filtering functions
    'groupNodesByID': function() {
      // Group all documented node packets by nodeID
        var nodeIDs = Nodes.aggregate(
          { $group: {
              // Group by matching nodeID
              _id: { nodeID: "$nodeID"},

              // Count number of matching docs for the group
              count: { $sum:  1 },

              // Save the _id's for matching docs
              docs: { $push: "$_id" }
          }},
        );
        // returns an array containing an object for each group
        // the objects in the array have the following fields
        // _id: Group criteria, i.e nodeID
        // count: Number of documents with the same nodeID
        // docs: Document IDs of all the nodes packets with the same nodeID
        return nodeIDs
    },

    'groupTagsByID': function() {
      // Group all documented tag packets by tagID
        var tagIDs = Tags.aggregate(
          { $group: {
              // Group by fields to match on (a,b)
              _id: { tagIDs: "$nodeID"},

              // Count number of matching docs for the group
              count: { $sum:  1 },

              // Save the _id for matching docs
              docs: { $push: "$_id" }
          }},
        );
        // returns an array containing an object for each group
        // the objects in the array have the following fields
        // _id: Group criteria, i.e tagID
        // count: Number of documents with the same tagID
        // docs: Document IDs of all the tag packets with the same tagID
        return tagIDs
    }

});
