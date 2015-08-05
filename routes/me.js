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
  var user = req.user;
  Collection.find({ $or: [
    {owners:user.name},
    {writers:user.name},
    {readers:user.name},
    {name: { $in: user.following }},
  ]}, function(err, collections) {
    collections = collections || [];
    var owns = [];
    var writes = [];
    var reads = [];
    var follows = [];
    for (var i = collections.length - 1; i >= 0; i--) {
      var col = collections[i];
      if (col.owners.indexOf(user.name) >= 0)
        owns.push(col);
      else if (user.following.indexOf(col.name) >= 0)
        follows.push(col);
      else if (col.writers.indexOf(user.name) >= 0)
        writes.push(col);
      else
        reads.push(col);
    };
    res.render('me/collections', {
      collections:collections,
      owns:owns,
      writes:writes,
      reads:reads,
      follows:follows,
    });
  });
});

// keys ---

router.post('/keys', function(req, res) {
  var user = req.user;
  var openpgp = require('openpgp');
  var ascii = req.body.key;
  var desc = req.body.description
  var key = openpgp.key.readArmored(ascii).keys[0];
  var pubkey = new User.Key();
  if (key.isPrivate()) {
    var pk = new User.Key();
    pk.description = desc;
    pk.key = ascii;
    pk.fingerprint = key.primaryKey.keyid.toHex();
    if (!user.private_keys)
      user.private_keys = [];
    user.private_keys.unshift(pk);
    //public key
    key = key.toPublic();
    ascii = key.armor()
  }
  pubkey.description = desc;
  pubkey.key = ascii;
  pubkey.fingerprint = key.primaryKey.keyid.toHex();
  if (!user.public_keys)
    user.public_keys = [];
  user.public_keys.unshift(pubkey);
  user.save(function (err) {
    if (err)
      res.send(err);                 
    res.redirect('settings')
  });
});

module.exports = router;