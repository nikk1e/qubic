var express = require('express');
var router = express.Router();

var User = require('../models/user');
var Collection = require('../models/collection');
var Document = require('../models/document');

function people(str, limit) {
  return User.find(
    { $text: { $search: str } },
    { score: { $meta: "textScore" } }
  ).sort(
    { score: { $meta: "textScore" } }
  ).limit(limit || 3
  ).select('name email displayName bio'
  ).lean(
  ).exec();
}

function collections(str, limit) {
  return Collection.find(
    { $text: { $search: str }, hidden:false },
    { score: { $meta: "textScore" } }
  ).sort(
    { score: { $meta: "textScore" } }
  ).limit(limit || 3
  ).select('name title description'
  ).lean(
  ).exec();
}

function documents(str, limit) {
  return Document.find(
    { $text: { $search: str }, hidden:false },
    { score: { $meta: "textScore" } }
  ).sort(
    { score: { $meta: "textScore" } }
  ).limit(limit || 20
  ).select('catalog title slug created'
  ).lean(
  ).exec();
}

router.get('/', function(req, res, next) {
  if (!req.query.q)
  	return res.render('search', { q:''});
  var q = req.query.q || '';
  Promise.all([
  	documents(q),
  	people(q),
  	collections(q)
  ]).then(function(values) {
  	var result = {
  		q:q,
  		documents: values[0],
  		people: values[1],
  		collections: values[2],
  	};
  	if (req.xhr)
  		res.send(result);
  	else
  		res.render('search', result);
  }).catch(function(e) {
  	next(e);
  });

});

router.get('/people', function(req, res, next) {
  var q = req.query.q || '';
  people(q).then(function(ps) {
  	res.send(ps);
  })
});

router.get('/collections', function(req, res, next) {
  var q = req.query.q || '';
  collections(q).then(function(ps) {
  	res.send(ps);
  }).catch(next);
});

router.get('/doucments', function(req, res, next) {
  var q = req.query.q || '';
  doucments(q).then(function(ps) {
  	res.send(ps);
  }).catch(next);
});


module.exports = router;