var express = require('express');
var router = express.Router();


router.get('/settings', function(req, res, next) {
  res.render('me/settings');
});

router.get('/models', function(req, res, next) {
  res.redirect('models/drafts')
});

router.get('/models/drafts', function(req, res, next) {
  res.render('me/stories', {});
});

router.get('/models/public', function(req, res, next) {
  res.render('me/stories', {});
});

router.get('/models/unlisted', function(req, res, next) {
  res.render('me/stories', {});
});

module.exports = router;