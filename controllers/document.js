const Document = require('../models/document');

//gets listed documents into the system
//assumes req.collection exists
module.exports.listed = function(req, res, next) {
  //TODO: check if you are logged in and what you might have access to.
  var filter = {
    'catalog': req.catalog
  };
  if (!req.collection_reader)
    filter.status = 'public'; //TODO: listed/unlisted
  //TODO: this should only be getting
  // the title, rights and slug (not the full document)
  Document.find(filter, function(err, docs){
    if (err) return next(err);
    req.docs = docs;
    next();
  });
};