var mongoose = require('mongoose');

var collectionSchema = mongoose.Schema({
	name :        { type: String, index: { unique: true }},
	title:        String,
	description:  String,
	created:      { type: Date, default: Date.now },
	hidden:       { type: Boolean, default: false }, //private
	owners:       [String], //Store these on the User
	writers:      [String], //Can submit documents to collection (and edit a document in a colleciton)
	readers:      [String],
});

collectionSchema.index({
	hidden: 1,
	title: 'text',
	description: 'text',
    name: 'text',
  },{
	weights:{
	  title:5
  }
});

collectionSchema.index({owners: 1});
collectionSchema.index({writers: 1});
collectionSchema.index({readers: 1});

module.exports = mongoose.model('Collection', collectionSchema);