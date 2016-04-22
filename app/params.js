//add all the params
var Collection = require('../models/collection'); //org
var Document   = require('../models/document');
var User       = require('../models/user');

function findDocument(req, res, next, title) {
  var ts = title.split(/-/g);
  var id = ts[ts.length-1];
  req.id = id;
  var username = req.user ? req.user.name : '';
  Document.findOne({ '_id' :  id }, function(err, doc) {
      if (err) {
          next(err);
      } else if (doc) {
          if (req.catalog && doc.catalog !== req.catalog)
            return res.redirect('/' + doc.catalog + '/' + title);
          req.doc = doc;
          req.writer = doc.status == 'full' ||
            doc.status == 'full_unlisted' ||
            (doc.writers.indexOf(username) > -1);
          req.reader = doc.status == 'public' ||
            doc.status == 'public_unlisted' ||
            req.writer ||
            (doc.readers.indexOf(username) > -1);
          next();
      } else {
        console.log('failed to find doc')
          next(new Error('failed to load doc'));
      }
    });
}

function findUser(req, res, next, name) {
  User.findOne({ 'name' :  name }, function(err, user) {
    if (err) {
        next(err);
    } else if (user) {
        req.collection = user;
        req.catalog = '@' + user.name;
        res.locals.catalog = req.catalog;
        req.is_collection = false;
        if (req.isAuthenticated() && req.user.name == name) {
          req.collection_writer = true;
          req.collection_reader = true;
          req.collection_owner = true;
        }
        next();
    } else {
        next(new Error('failed to load user'));
    }
  });
}

function findCollection(req, res, next, name) {
  Collection.findOne({ 'name' :  name }, function(err, collection) {
        if (err) {
            next(err);
        } else if (collection) {
            req.catalog = collection.name;
            res.locals.catalog = req.catalog;
            req.collection = collection;
            req.is_collection = true;
            if (req.isAuthenticated()) {
              var username = req.user.name;
              req.collection_owner = (collection.owners.indexOf(username) > -1);
              req.collection_writer = req.collection_owner ||
                (collection.writers.indexOf(username) > -1);
              req.collection_reader = req.collection_writer ||
                (collection.readers.indexOf(username) > -1);
            }
            next();
        } else {
            next(new Error('failed to load collection'));
        }
    });
}

function findCatalog(req, res, next, catalog) {
  if (catalog[0] === '@')
    findUser(req, res, next, catalog.slice(1));
   else
    findCollection(req, res, next, catalog);
}

module.exports = {
  findDocument,
  findUser,
  findCollection,
  findCatalog
};