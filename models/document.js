var mongoose = require('mongoose');

/*
Document represents the published document.

Note: since _id is unique a document can appear
in one and only one collection.
*/
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

documentSchema.index({collection: 1, 
	title: 'text', 
	text: 'text', 
	slug: 'text'
},{
	weights:{
		title:10,
		slug:5
		//text: 1
	}
});
documentSchema.index({collection: 1});

module.exports = mongoose.model('Document', documentSchema);