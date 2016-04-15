var router = require('express').Router();

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

//TODO: these should all just be api calls rather that urls.

function update(proc) {
	return (req, res) => {
		var user = req.user
		proc(user);
		user.save((err) => {
			res.redirect('/settings/profile');
		});
	}
}

router.get('local', update((user) => {
	user.local.email    = undefined;
	user.local.password = undefined;
}));
router.get('facebook', update((user) => {
	user.facebook.token = undefined;
}));
router.get('twitter', update((user) => {
	user.twitter.token = undefined;
}));
router.get('google', update((user) => {
	user.google.token = undefined;
}));
router.get('github', update((user) => {
	user.github.token = undefined;
}));

module.exports = router;