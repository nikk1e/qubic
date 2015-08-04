var mongoose = require('mongoose');

var collectionSchema = mongoose.Schema({
	name :        { type: String, index: { unique: true }},
	title:        String,
	description:  String,
	created:      { type: Date, default: Date.now },
	hidden:       Boolean, //private
	owners:       [String], //Store these on the User
	writers:      [String],
	readers:      [String],
});

collectionSchema.index({title: 'text', description: 'text'},{
	weights:{
		title:5
	}
});

module.exports = mongoose.model('Collection', collectionSchema);