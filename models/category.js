var mongoose = require('mongoose');

//Called category so it doesn't conflict with "collection" keyword in Mongo
var categorySchema = mongoose.Schema({
	name :        { type: String, index: { unique: true }},
	title:        String,
	description:  String,
	created:      { type: Date, default: Date.now },
	hidden:       Boolean, //private
	owners:       [String], //Store these on the User
	writers:      [String],
	readers:      [String]
});

categorySchema.index({title: 'text', description: 'text'});

module.exports = mongoose.model('Category', categorySchema);