const Document = require('../models/document');

//gets listed documents into the system
//assumes req.collection exists
module.exports.listed = function(req, res, next) {
  Document.find({
      'catalog':req.catalog,
      'status':'public',
    }, function(err, docs){
      if (err) return next(err);
      req.docs = docs;
      next();
    });
};