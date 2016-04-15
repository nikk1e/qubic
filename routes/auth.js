var express = require('express');
var router = express.Router();
//TODO: how do we get this to work.
var passport = require('passport');

var pa = type => {
	return passport.authenticate(type, {
		successReturnToOrRedirect : '/', //username
		failureRedirect : '/'
	});
}

var pae = (type, scope) => {
	return passport.authenticate(type, scope);
}

//connect is just auth (except local which doesn't have a connect)

router.get('/auth/ad', pa('ad'));

router.get('/auth/facebook', pae('facebook', { scope : 'email' }));
router.get('/auth/facebook/callback', pa('facebook'));

router.get('/auth/twitter', pae('twitter', { scope : 'email' }));
router.get('/auth/twitter/callback', pa('twitter'));

router.get('/auth/github', pae('github', { scope : 'email' }));
router.get('/auth/github/callback', pa('github'));

router.get('/auth/google', pae('google', { scope : ['profile', 'email'] }));
router.get('/auth/google/callback', pa('google'));

module.exports = router;