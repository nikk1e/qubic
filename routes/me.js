var express = require('express');
var router = express.Router();

var User = require('../models/user');
var Collection = require('../models/collection');
var Document = require('../models/document');

router.get('/settings', function(req, res, next) {
  res.render('me/settings');
});

router.get('/models', function(req, res, next) {
  res.redirect('models/drafts');
});

router.get('/models/drafts', function(req, res, next) {
  Document.find({
  	'_id': { '$in': req.user.drafts }
  }, function(err, docs){
    res.render('me/stories-draft', { stories:(docs || []) });
  });
});

router.get('/models/public', function(req, res, next) {
  Document.find({
  	'catalog':('@' + req.user.name),
  	'hidden':false
  }, function(err, docs){
    res.render('me/stories-public', { stories:(docs || []) });
  });
});

router.get('/models/unlisted', function(req, res, next) {
  Document.find({
  	'catalog':('@' + req.user.name),
  	'hidden':true
  }, function(err, docs){
    res.render('me/stories-unlisted', { stories:(docs || []) });
  });
});

router.get('/collections', function(req, res, next) {
  //list collections I am involved in.
  res.render('me/collections', {});
});

module.exports = router;