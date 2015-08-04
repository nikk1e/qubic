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