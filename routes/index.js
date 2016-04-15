var Collection = require('../models/collection'); //org
var Document   = require('../models/document');
var User       = require('../models/user');
var moment     = require('moment');
var passport   = require('passport');


module.exports = function(app) {

// normal routes ===============================================================
	
	// show the home page (will also have our login links)
	//TODO: this should not be doing lastEditedDocuments until it knows you are
	// authenticated.
	app.get('/', function(req, res) {
		if (req.isAuthenticated()) {
			return res.redirect('/@' + req.user.name);
		}
		//TODO: render static front page
		res.render('index', { documents:[], writerOf:[]} );
	});

	// EDIT SECTION ============================

	function genId() {
		var rid = app.locals.rack();
		var hour = app.locals.rackHour.toString(36);
		return hour + rid;
	}

	app.get('/new', isLoggedIn, function(req, res, next) {
		//TODO: This cannot be on the get
		// as it will be triggered 
		// should actually be triggered when typing starts.
		var id = genId();
		var doc = new Document();
		doc.hidden = true;
		doc._id = id;
		doc.catalog = '@' + req.user.name;
		doc.title = '';
		doc.slug = '';
		doc.save(function(err) {
			if (err) return next(err);
			req.user.save(function(err) {
				if (err) return next(err);
				res.redirect('/edit/' + id);
			});
		});
	});



	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/reset-password', function(req, res) {
		//TODO save all the form details to mongo
		res.render('reset-password');
	});

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login form
		app.get('/login', function(req, res) {
			if (req.ntlm)
				res.redirect('/auth/ad');
			else
				res.render('login', {
					message: req.flash('loginMessage'),
				});
		});

		// process the login form
		app.post('/login', passport.authenticate('local', {
			successReturnToOrRedirect : '/', // redirect to the secure profile section
			failureRedirect : '/login', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

		// SIGNUP =================================
		// show the signup form
		app.get('/signup', function(req, res) {
			res.render('signup', { message: req.flash('signupMessage') });
		});

		// process the signup form
		app.post('/signup', passport.authenticate('signup', {
			successReturnToOrRedirect : '/me', // redirect to the secure profile section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));


	// collections -------


	





	// Share ----------

  	function fix_utf8(o) {
  		if (o.type === 'char') {
  			var x = o.value.length
  			try {
  			o.value = decodeURIComponent(escape(o.value));
  			if (o.value.length != o.n)
  				console.log(o)
  			if (o.value.length != x)
  				console.log(o)
  			} catch(e) {
  				console.log(o)
  			}
  		}
  		return o;
  	}



/*
	app.get('/@:name/:title/:rev?', show_revision);
	app.get('/:collection/:title/:rev?', show_revision);

	app.get('/@:name', function(req, res, next) {
		req.catalog = ('@' + req.collection.name);
		Document.find({
  			'catalog':req.catalog,
  			'status':'public',
  		}, function(err, docs){
  			if (err) return next(err);
    		res.render('profile', {
				user: req.collection,
				stories: (docs || []),
			});
  		});
	});



	app.get('/:collection', function(req, res) {
		var col = req.collection;
		req.catalog = col.name;
		//TODO: if req.user.name and user in collection
		// then show private and unlisted
		Document.find({
  			'catalog':col.name,
  			'status':'public',
  		}, function(err, docs){
  			if (err) return next(err);
    		res.render('collection', {
				collection: col,
				stories: (docs || []) //TODO: rename
			});
  		});
	});	
	*/
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	if (req.session)
		req.session.returnTo = req.originalUrl || req.url;

	//if we have active directory we use that.
	if (req.ntlm)
		res.redirect('/auth/ad');
	else
		res.redirect('/login');
}

