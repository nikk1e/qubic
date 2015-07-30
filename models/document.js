var mongoose = require('mongoose');

var documentSchema = mongoose.Schema({
	_id : String,
	collection: String, //or @username
	title: String,
	slug: String,
	text: String,
	data: String, //snapshot
	created: { type: Date, default: Date.now },
	hidden: Boolean //unlisted
});

documentSchema.index({title: 'text', text: 'text', collection: 1});
documentSchema.index({collection: 1});

module.exports = mongoose.model('Document', documentSchema);