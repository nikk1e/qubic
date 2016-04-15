var router   = require('express').Router();
var passport = require('passport');

var pa = type => {
	return passport.authenticate(type, {
		successReturnToOrRedirect : '/',
		failureRedirect : '/'
	});
}

var pae = (type, scope) => {
	return passport.authenticate(type, scope);
}

//connect is just auth (except local which doesn't have a connect)

router.get('/ad', pa('ad'));

router.get('/facebook', pae('facebook', { scope : 'email' }));
router.get('/facebook/callback', pa('facebook'));

router.get('/twitter', pae('twitter', { scope : 'email' }));
router.get('/twitter/callback', pa('twitter'));

router.get('/github', pae('github', { scope : 'email' }));
router.get('/github/callback', pa('github'));

router.get('/google', pae('google', { scope : ['profile', 'email'] }));
router.get('/google/callback', pa('google'));

module.exports = router;