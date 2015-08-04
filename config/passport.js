// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GithubStrategy   = require('passport-github').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
var CustomStrategy   = require('passport-custom').Strategy;

// load up the user model
var User       = require('../models/user');

// load the auth variables from environmen
var configAuth = {};

if (process.env.TWITTER_KEY) {
    configAuth.twitter = {
        consumerKey: process.env.TWITTER_KEY,
        consumerSecret:  process.env.TWITTER_SECRET,
        callbackURL: ""
    };
}

if (process.env.FACEBOOK_ID) {
    configAuth.facebook = {
        clientID: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: ""
    };
}

if (process.env.GOOGLE_ID) {
    configAuth.google = {
        clientID: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        callbackURL: ""
    };
}

if (process.env.GITHUB_ID) {
    configAuth.github = {
        clientID: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
        callbackURL: ""
    };
}

if (process.env.AD_CONTROLLER)
    configAuth.ad = true;

configAuth.social = configAuth.github ||
    configAuth.google ||
    configAuth.facebook ||
    configAuth.twitter;

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
            User.findOne({$or:[{'local.email':email},{'name':email}]}, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.'));

                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

                // all is well, return user
                else
                    return done(null, user);
            });
        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        // create the user
                        var newUser            = new User();

                        newUser.name           = (req.body.name || 'unknown').toLowerCase();
                        newUser.local.email    = email;
                        newUser.local.password = newUser.generateHash(password);

                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            return done(null, newUser);
                        });
                    }

                });
            // if the user is logged in but has no local account...
            } else if ( !req.user.local.email ) {
                // ...presumably they're trying to connect a local account
                // BUT let's check if the email used to connect a local account is being used by another user
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    if (err)
                        return done(err);
                    
                    if (user) {
                        return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
                        // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                    } else {
                        var user = req.user;
                        user.local.email = email;
                        user.local.password = user.generateHash(password);
                        user.save(function (err) {
                            if (err)
                                return done(err);
                            
                            return done(null,user);
                        });
                    }
                });
            } else {
                // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                return done(null, req.user);
            }

        });

    }));

    // =========================================================================
    // Active Directory ========================================================
    // =========================================================================
    if (configAuth.ad) {
        passport.use('ad', new CustomStrategy(
            function(req, done) {

            if (req.ntlm==undefined || req.ntlm.UserName==='')
                return done(null, false,
                    req.flash('loginMessage', 'AD authentication failed.'));

            // asynchronous
            process.nextTick(function() {
                var id = (req.ntlm.DomainName + '\\' + req.ntlm.UserName).toLowerCase();
                // check if the user is already logged in
                if (!req.user) {

                    User.findOne({ 'ad.id' : id }, function(err, user) {
                        if (err)
                            return done(err);

                        if (user) {
                            return done(null, user);
                        } else {
                            // if there is no user, create them
                            var newUser       = new User();
                            newUser.name      = req.ntlm.UserName.toLowerCase();
                            newUser.ad.id     = id;
                            newUser.ad.name   = req.ntlm.UserName;
                            newUser.ad.domain = req.ntlm.DomainName;

                            newUser.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, newUser);
                            });
                        }
                    });
                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user            = req.user; // pull the user out of the session

                    user.ad.id     = id;
                    user.ad.name   = req.ntlm.UserName;
                    user.ad.domain = req.ntlm.DomainName;

                    user.save(function(err) {
                        if (err)
                            return done(err);

                        return done(null, user);
                    });

                }
            });

        }));
    }

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    if (configAuth.facebook) {
        passport.use(new FacebookStrategy({
    
            clientID        : configAuth.facebook.clientID,
            clientSecret    : configAuth.facebook.clientSecret,
            callbackURL     : configAuth.facebook.callbackURL,
            passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    
        },
        function(req, token, refreshToken, profile, done) {
    
            // asynchronous
            process.nextTick(function() {
    
                // check if the user is already logged in
                if (!req.user) {
    
                    User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);
    
                        if (user) {
    
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.facebook.token) {
                                user.facebook.token = token;
                                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                                user.facebook.email = (profile.emails[0].value || '').toLowerCase();
    
                                user.save(function(err) {
                                    if (err)
                                        return done(err);
                                        
                                    return done(null, user);
                                });
                            }
    
                            return done(null, user); // user found, return that user
                        } else {
                            // if there is no user, create them
                            var newUser            = new User();
    
                            newUser.facebook.id    = profile.id;
                            newUser.facebook.token = token;
                            newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                            newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();
    
                            newUser.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, newUser);
                            });
                        }
                    });
    
                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user            = req.user; // pull the user out of the session
    
                    user.facebook.id    = profile.id;
                    user.facebook.token = token;
                    user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                    user.facebook.email = (profile.emails[0].value || '').toLowerCase();
    
                    user.save(function(err) {
                        if (err)
                            return done(err);
                            
                        return done(null, user);
                    });
    
                }
            });
    
        }));
    }

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    if (configAuth.twitter) {
        passport.use(new TwitterStrategy({
    
            consumerKey     : configAuth.twitter.consumerKey,
            consumerSecret  : configAuth.twitter.consumerSecret,
            callbackURL     : configAuth.twitter.callbackURL,
            passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    
        },
        function(req, token, tokenSecret, profile, done) {
    
            // asynchronous
            process.nextTick(function() {
    
                // check if the user is already logged in
                if (!req.user) {
    
                    User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);
    
                        if (user) {
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.twitter.token) {
                                user.twitter.token       = token;
                                user.twitter.username    = profile.username;
                                user.twitter.displayName = profile.displayName;
    
                                user.save(function(err) {
                                    if (err)
                                        return done(err);
                                        
                                    return done(null, user);
                                });
                            }
    
                            return done(null, user); // user found, return that user
                        } else {
                            // if there is no user, create them
                            var newUser                 = new User();
    
                            newUser.twitter.id          = profile.id;
                            newUser.twitter.token       = token;
                            newUser.twitter.username    = profile.username;
                            newUser.twitter.displayName = profile.displayName;
    
                            newUser.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, newUser);
                            });
                        }
                    });
    
                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user                 = req.user; // pull the user out of the session
    
                    user.twitter.id          = profile.id;
                    user.twitter.token       = token;
                    user.twitter.username    = profile.username;
                    user.twitter.displayName = profile.displayName;
    
                    user.save(function(err) {
                        if (err)
                            return done(err);
                            
                        return done(null, user);
                    });
                }
    
            });
    
        }));
    }

    // =========================================================================
    // GITHUB  =================================================================
    // =========================================================================
    if (configAuth.github) {
        passport.use(new GithubStrategy({
    
            clientID     : configAuth.github.clientID,
            clientSecret  : configAuth.github.clientSecret,
            callbackURL     : configAuth.github.callbackURL,
            passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    
        },
        function(req, token, tokenSecret, profile, done) {
    
            // asynchronous
            process.nextTick(function() {
    
                // check if the user is already logged in
                if (!req.user) {
    
                    User.findOne({ 'github.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);
    
                        if (user) {
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.github.token) {
                                user.github.token       = token;
                                user.github.username    = profile.username;
                                user.github.displayName = profile.displayName;
                                user.github.email       = (profile.emails[0].value || '').toLowerCase();
    
                                user.save(function(err) {
                                    if (err)
                                        return done(err);
                                        
                                    return done(null, user);
                                });
                            }
    
                            return done(null, user); // user found, return that user
                        } else {
                            // if there is no user, create them
                            var newUser                 = new User();
    
                            newUser.github.id          = profile.id;
                            newUser.github.token       = token;
                            newUser.github.username    = profile.username;
                            newUser.github.displayName = profile.displayName;
                            newUser.github.email       = (profile.emails[0].value || '').toLowerCase();
    
                            newUser.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, newUser);
                            });
                        }
                    });
    
                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user                 = req.user; // pull the user out of the session
    
                    user.github.id          = profile.id;
                    user.github.token       = token;
                    user.github.username    = profile.username;
                    user.github.displayName = profile.displayName;
                    user.github.email       = (profile.emails[0].value || '').toLowerCase();
    
                    user.save(function(err) {
                        if (err)
                            return done(err);
                            
                        return done(null, user);
                    });
                }
    
            });
    
        }));
    }

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    if (configAuth.google) {
        passport.use(new GoogleStrategy({
    
            clientID        : configAuth.google.clientID,
            clientSecret    : configAuth.google.clientSecret,
            callbackURL     : configAuth.google.callbackURL,
            passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    
        },
        function(req, token, refreshToken, profile, done) {
    
            // asynchronous
            process.nextTick(function() {
    
                // check if the user is already logged in
                if (!req.user) {
    
                    User.findOne({ 'google.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);
    
                        if (user) {
    
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.google.token) {
                                user.google.token = token;
                                user.google.name  = profile.displayName;
                                user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
    
                                user.save(function(err) {
                                    if (err)
                                        return done(err);
                                        
                                    return done(null, user);
                                });
                            }
    
                            return done(null, user);
                        } else {
                            var newUser          = new User();
    
                            newUser.google.id    = profile.id;
                            newUser.google.token = token;
                            newUser.google.name  = profile.displayName;
                            newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
    
                            newUser.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, newUser);
                            });
                        }
                    });
    
                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user               = req.user; // pull the user out of the session
    
                    user.google.id    = profile.id;
                    user.google.token = token;
                    user.google.name  = profile.displayName;
                    user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
    
                    user.save(function(err) {
                        if (err)
                            return done(err);
                            
                        return done(null, user);
                    });
    
                }
    
            });
    
        }));
    }
};

module.exports.config = configAuth;
