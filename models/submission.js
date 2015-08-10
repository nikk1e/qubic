var mongoose = require('mongoose');

/*
Submission is a document snapshot sent to an
editor for the addition to, or update within,
a collection.

Created by clicking snapshot.
*/
var submissionSchema = mongoose.Schema({
	_id : String,
	document_id : String,
	catalog: String, //<collection.name>
	title: String,
	slug: String,
	text: String,
	data: String, //snapshot
	version: { type: Number, default: 0 },
	created: { type: Date, default: Date.now },
	submitted_by: String,
});

submissionSchema.index({catalog: 1});
submissionSchema.index({document_id: 1});

module.exports = mongoose.model('Submission', submissionSchema);