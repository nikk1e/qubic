const Collection = require('../models/collection');
const User = require('../models/collection');
const Document = require('../models/document');

module.exports.loadCatalogs = function(req, res, next) {
  //assume req.user
  var user = req.user;
  if (!user) {
  	res.locals.owns = [];
  	res.locals.writes = [];
  	res.locals.reads = [];
  	return next();
  } else {
  	res.locals.owns = [user];
  	res.locals.writes = [user];
  	res.locals.reads = [user];
  }
  Collection.find({owners:user.name},function(err, collections) {
  	if (err) return next(err);
  	res.locals.owns = [user].concat(collections);
  	Collection.find({writers:user.name}, function(err, writes) {
  		if (err) return next(err);
  		res.locals.writes = res.locals.owns.concat(writes);
  		Collection.find({readers:user.name}, function(err, reads) {
  			if (err) return next(err);
  			res.locals.reads = res.locals.writes.concat(reads);
  			next();
  		});
  	});
  });
};

//given a list of catalogs return the last n files
module.exports.fanIn = function(catalogs, n, next) {
	//TODO: find top n documents 
	//Document.find({}).limit(n).exec(function(err, docs) {})
	next(null);
};