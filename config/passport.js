const passport = require('passport');
const User     = require('../models/user');

module.exports.passport = passport;

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

var config = {
    social: false
}

module.exports.config = config;

if (process.env.AD_CONTROLLER) {
    //On AD only use AD
    passport.use('ad', require('./passport/active_directory'));
} else {
    //Allways offer local
    passport.use('local', require('./passport/local'));
    passport.use('signup', require('./passport/signup'));

    if (process.env.TWITTER_KEY) {
        passport.use(require('./passport/twitter'));
        config.social = config.twitter = true;
    }
    
    if (process.env.FACEBOOK_ID) {
        passport.use(require('./passport/facebook'));
        config.social = config.facebook = true;
    }

    if (process.env.GOOGLE_ID) {
        passport.use(require('./passport/google'));
        config.social = config.google = true;
    }

    if (process.env.GITHUB_ID) {
        passport.use(require('./passport/github'));
        config.social = config.github = true;
    }
}
