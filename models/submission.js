var mongoose = require('mongoose');

/*
Submission is a document snapshot sent to an
editor for the addition to, or update within,
a collection.

Created by clicking snapshot.
*/
var submissionSchema = mongoose.Schema({
	document_id : String,
	collection: String,
	title: String,
	slug: String,
	text: String,
	data: String, //snapshot
	created: { type: Date, default: Date.now },
	submitted_by: String,
});

submissionSchema.index({collection: 1});
submissionSchema.index({document_id: 1});

module.exports = mongoose.model('Submission', submissionSchema);