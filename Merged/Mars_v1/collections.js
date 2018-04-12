import { Mongo } from "meteor/mongo";

Status = new Mongo.Collection('status');

Nodes = new Mongo.Collection('nodes');
Tags = new Mongo.Collection('tags');

SortedNodes = new Mongo.Collection('sortedNodes');
SortedTags = new Mongo.Collection('sortedTags');
