var router   = require('express').Router();
var passport = require('passport');

router.get('/login', function(req, res) {
  res.render('login', {
    message: req.flash('loginMessage'),
  });
});

router.post('/login', passport.authenticate('local', {
  successReturnToOrRedirect : '/', // redirect to the secure profile section
  failureRedirect : '/login', // redirect back to the signup page if there is an error
  failureFlash : true // allow flash messages
}));

router.get('/signup', function(req, res) {
  res.render('signup', { message: req.flash('signupMessage') });
});

router.post('/signup', passport.authenticate('signup', {
  successReturnToOrRedirect : '/', // redirect to the secure profile section
  failureRedirect : '/signup', // redirect back to the signup page if there is an error
  failureFlash : true // allow flash messages
}));

router.get('/reset-password', function(req, res) {
  //TODO save all the form details to mongo
  res.render('reset-password');
});

module.exports = router;