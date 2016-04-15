//add all the params
var Collection = require('../models/collection'); //org
var Document   = require('../models/document');
var User       = require('../models/user');

module.exports = (app) => {
	app.param('title', function(req, res, next, title) {
		var ts = title.split(/-/g);
		var id = ts[ts.length-1];
		req.id = id;
		Document.findOne({ '_id' :  id }, function(err, doc) {
    		if (err) {
      			next(err);
    		} else if (doc) {
      			req.doc = doc;
      			next();
    		} else {
    			console.log('failed to find doc')
      			next(new Error('failed to load doc'));
    		}
  		});
	});

	app.param('name', function(req, res, next, name) {
		User.findOne({ 'name' :  name }, function(err, user) {
    		if (err) {
      			next(err);
    		} else if (user) {
      			req.collection = user;
      			next();
    		} else {
      			next(new Error('failed to load user'));
    		}
  		});
	});
};