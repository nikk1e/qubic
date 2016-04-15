/*

Invite someone to a collection/organisation

https://usecanvas.com/mavxg-corp/join?token=6oG24emRtuXOEdiBDHUDLH

*/

var mongoose = require('mongoose');

var inviteSchema = mongoose.Schema({
	_id : String, //token //TODO: probabaly do not want _id to be token
	catalog: String, //<collection.name>
	email: String, //who it was sent to
	created: { type: Date, default: Date.now },
	updated: { type: Date }
});

inviteSchema.index({catalog: 1});

inviteSchema.index({email: 1});

module.exports = mongoose.model('Invite', inviteSchema);