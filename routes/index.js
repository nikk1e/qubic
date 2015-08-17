var Collection = require('../models/collection');
var Document   = require('../models/document');
var Submission = require('../models/submission');
var User       = require('../models/user');
var ot         = require('ot-sexpr');

module.exports = function(app, passport, share) {

// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/', function(req, res) {
		if (req.isAuthenticated()) {
			//load users relevant stories (follows)
		} else {
			//load stories from highlights collection
		}
		res.render('index');
	});

	app.get('/play', function(req, res, next) {
		var id = app.locals.rack();
		var hour = app.locals.rackHour.toString(36);
  		res.redirect('/play/'+ hour + id);
	});

	app.get('/play/:id', function(req, res, next) {
  		res.render('play', { title: 'Qubic', docId: req.params.id });
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

	app.param('draftId', function(req, res, next, id) {
		//check permissions
		Document.findOne({ _id :  id }, function(err, doc) {
    		if (err) return next(err);
    		if (!doc) return next(new Error('could not find doc ' + id));
    		req.doc = doc;
    		if (doc.catalog[0] === '@') {
    			var uname = doc.catalog.slice(1);
    			if (req.user && uname === req.user.name) {
    				req.catalog = req.user;
    				req.can_edit = true;
    				req.can_publish = true;
    				return next();
    			}
    			User.findOne({name:uname}, function(err, user) {
    				if (err) return next(err);
    				req.catalog = user;
    				next();
    			});
    		} else {
    			Collection.findOne({name: doc.catalog}, function(err, col) {
    				if (err) return next(err);
    				if (!col) return next(new Error('Could not find collection ' + doc.catalog))
    				req.catalog = col;
    				if (col.owners.indexOf(req.user.name) >= 0) {
    					req.can_publish = true;
    					req.can_edit = true;
    				}
					else if (col.writers.indexOf(req.user.name) >= 0)
    					req.can_edit = true;
    				next();
    			});
    		}
  		});
	});

	function myCollections(req, res, next) {
		var user = req.user;
  		Collection.find({ $or: [
    		{owners:user.name},
    		{writers:user.name},
    		{readers:user.name},
		]}, 'name owners writers readers', function(err, collections) {
			if (err) return next(err);
			var owns = ['@' + user.name];
    		var writes = [];
    		var reads = [];
    		for (var i = collections.length - 1; i >= 0; i--) {
    		  var col = collections[i];
    		  if (col.owners.indexOf(user.name) >= 0)
    		    owns.push(col.name);
    		  else if (col.writers.indexOf(user.name) >= 0)
    		    writes.push(col.name);
    		  else
    		    reads.push(col.name);
    		}
    		req.owns = owns;
    		req.writes = writes;
    		req.reads = reads;
    		next();
		});
  	}

	app.get('/edit/:draftId', isLoggedIn, myCollections, function(req, res, next) {
		var id = req.params.draftId;
		var user = req.user;
		if (!req.can_edit)
			return next('You do not have permssion to edit this document.');
		res.render('edit', {
			title: 'Qubic',
			doc: req.doc,
			catalog: req.catalog,
			owns: JSON.stringify(req.owns),
			writes: JSON.stringify(req.writes),
			docId: id,
		});
	});

	//update a document in its current location
	app.post('/edit/:draftId', isLoggedIn, function(req, res, next) {
		//update document
		var doc = req.doc;
		var body = req.body;
		if (!req.can_publish)
			return next(new Error('You do not have permission to update this document'));
		
		console.log(body);

		doc.title = body.title || doc.title;
		doc.slug = body.slug || doc.slug;
		//doc.text = body.text || doc.text;
		//doc.data = body.data || doc.data;
		//doc.status = body.status || doc.status;
		//doc.version = parseInt(body.version) || doc.version;
		doc.save(function(err) {
			if (err) return next(err);
			res.send({message:'Document updated'});
		});
	});

	//move a document to a new location
	app.post('/publish/:catalog/:draftId', isLoggedIn, function(req, res, next) {
		//update document
		var doc = req.doc;
		var body = req.body;
		var col = req.catalog;
		var user = req.user;
		if (!req.can_publish)
			return next(new Error('You do not have permission to publish this document'));
		if (req.is_collection && col.owners.indexOf(user.name) === -1) {
			console.log(col.owners)
			return next(new Error('You do not have permission to publish to this collection'));
		}
		else if (!req.is_collection && col.name !== req.user.name)
			return next(new Error('You do not have permission to publish to this user'));

		console.log(body);

		var status = body.status || (col.hidden ? 'unlisted' : 'public');

		doc.title = body.title;
		doc.catalog = req.params.catalog;
		doc.slug = body.slug;
		doc.text = body.text;
		//doc.data = body.data;
		doc.status = status;
		//doc.version = parseInt(body.version);
		doc.save(function(err) {
			if (err) return next(err);
			res.send({message:'Document updated'});
		});
	});

	app.post('/submit/:catalog/:draftId', isLoggedIn, function(req, res, next) {
		//submit document for publication
		var col = req.catalog;
		var doc = req.doc;
		var user = req.user;
		var body = req.body;
		if (!req.can_publish)
			next('You do not have permission to submit this document');
		if (!req.is_collection)
			return next(new Error('Cannot submit document to a user'));
		if (col.writers.indexOf(user.name) === -1 &&
			col.owners.indexOf(user.name) === -1)
			return next(new Error('You do not have permission to submit to this collection'));

		var sub = new Submission();
		sub._id = genId();
		sub.document_id = doc.id;
		sub.catalog = req.params.catalog;
		sub.title = body.title;
		sub.slug = body.slug;
		sub.text = body.text;
		sub.data = body.data;
		//sub.version = parseInt(body.version);
		sub.submitted_by = req.user.name;
		sub.save(function(err) {
			if (err) return next(err);
			res.send({message: ('Document Submitted to ' + sub.catalog)});
		});
	});

	app.param('catalog', function(req, res, next, name) {
		if (name[0] === '@') {
			User.findOne({name:name.slice(1)}, function(err, user) {
				if (err) {
					next(err);
				} else if (user) {
					req.catalog = user;
					req.is_collection = false;
					next();
				} else {
					next(new Error('failed to load user'));
				}
			});
		} else {
			Collection.findOne({ 'name' :  name }, function(err, collection) {
    			if (err) {
      				next(err);
    			} else if (collection) {
      				req.catalog = collection;
      				req.is_collection = true;
      				next();
    			} else {
      				next(new Error('failed to load collection'));
    			}
  			});
		}
	});

	app.param('submission', function(req, res, next, id) {
		Submission.findOne({_id: id}, function(err, sub) {
			if (err) return next(err);
			req.submission = sub;
		});
	})

	app.post('/accept/:collection/:submission', isLoggedIn, function(req, res, next) {
		var col = req.collection;
		var user = req.user;
		var sub = req.submission;
		if (col.owners.indexOf(user.name) === -1)
			next('You do not have permission to publish to this collection');
		Document.findOne({_id:sub.document_id}, function(err, doc) {
			if (err) return next(err);
			doc.catalog = req.params.catalog;
			doc.title = sub.title;
			doc.slug = sub.slug;
			doc.text = sub.text;
			doc.data = sub.data;
			doc.version = sub.version;
			doc.save(function(err) {
				if (err) return next(err);
				sub.remove();
				res.send({message: ('Submission published to ' + doc.catalog)});
			})
		});
	})

	// PROFILE SECTION =========================
	app.get('/me/settings', isLoggedIn, function(req, res) {
		res.render('profile', {
			user : req.user
		});
	});

	//redirect a user to their page
	app.get('/me', isLoggedIn, function(req, res) {
		res.redirect('/@' + req.user.name);
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
		app.post('/login', passport.authenticate('local-login', {
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
		app.post('/signup', passport.authenticate('local-signup', {
			successReturnToOrRedirect : '/me', // redirect to the secure profile section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

	// active directory ------------

		app.get('/auth/ad', passport.authenticate('ad', {
			successReturnToOrRedirect : '/me',
			failureRedirect : '/'
		}));

	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

		// handle the callback after facebook has authenticated the user
		app.get('/auth/facebook/callback',
			passport.authenticate('facebook', {
				successReturnToOrRedirect : '/me',
				failureRedirect : '/'
			}));

	// twitter --------------------------------

		// send to twitter to do the authentication
		app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

		// handle the callback after twitter has authenticated the user
		app.get('/auth/twitter/callback',
			passport.authenticate('twitter', {
				successReturnToOrRedirect : '/me',
				failureRedirect : '/'
			}));

	// github --------------------------------

		// send to github to do the authentication
		app.get('/auth/github', passport.authenticate('github', { scope : 'email' }));

		// handle the callback after github has authenticated the user
		app.get('/auth/github/callback',
			passport.authenticate('github', {
				successReturnToOrRedirect : '/me',
				failureRedirect : '/'
			}));


	// google ---------------------------------

		// send to google to do the authentication
		app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

		// the callback after google has authenticated the user
		app.get('/auth/google/callback',
			passport.authenticate('google', {
				successReturnToOrRedirect : '/me',
				failureRedirect : '/'
			}));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

	// locally --------------------------------
		app.get('/connect/local', function(req, res) {
			res.render('connect-local.ejs', { message: req.flash('loginMessage') });
		});
		app.post('/connect/local', passport.authenticate('local-signup', {
			successRedirect : '/me/settings', // redirect to the secure profile section
			failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

		// handle the callback after facebook has authorized the user
		app.get('/connect/facebook/callback',
			passport.authorize('facebook', {
				successRedirect : '/me/settings',
				failureRedirect : '/'
			}));

	// twitter --------------------------------

		// send to twitter to do the authentication
		app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

		// handle the callback after twitter has authorized the user
		app.get('/connect/twitter/callback',
			passport.authorize('twitter', {
				successRedirect : '/me/settings',
				failureRedirect : '/'
			}));

	// github --------------------------------

		// send to github to do the authentication
		app.get('/connect/github', passport.authorize('github', { scope : 'email' }));

		// handle the callback after github has authorized the user
		app.get('/connect/github/callback',
			passport.authorize('github', {
				successRedirect : '/me/settings',
				failureRedirect : '/'
			}));


	// google ---------------------------------

		// send to google to do the authentication
		app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

		// the callback after google has authorized the user
		app.get('/connect/google/callback',
			passport.authorize('google', {
				successRedirect : '/me/settings',
				failureRedirect : '/'
			}));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	app.get('/unlink/local', isLoggedIn, function(req, res) {
		var user            = req.user;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/me/settings');
		});
	});

	// facebook -------------------------------
	app.get('/unlink/facebook', isLoggedIn, function(req, res) {
		var user            = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/me/settings');
		});
	});

	// twitter --------------------------------
	app.get('/unlink/twitter', isLoggedIn, function(req, res) {
		var user           = req.user;
		user.twitter.token = undefined;
		user.save(function(err) {
			res.redirect('/me/settings');
		});
	});

	// google ---------------------------------
	app.get('/unlink/google', isLoggedIn, function(req, res) {
		var user          = req.user;
		user.google.token = undefined;
		user.save(function(err) {
			res.redirect('/me/settings');
		});
	});


	// collections -------

	app.get('/new-collection', isLoggedIn, function(req, res) {
		var collection = new Collection();
		collection.name = '';
		collection.title = '';
		collection.description = '';
		collection.owners.push(req.user.name);
		res.render('new-collection', {collection:collection});
	});

	app.post('/new-collection', isLoggedIn, function(req, res) {
		var col = new Collection();
		var body = req.body;
		//TODO: validate name
		col.name = req.body.name.replace(' ','-');
		col.title = req.body.title;
		col.description = req.body.description;
		col.owners = body.owners.split(/ *[,;] */g);
		if (col.owners.length === 0)
			col.owners.push(req.user.name);
		col.writers = body.writers.split(/ *[,;] */g);
		col.readers = body.readers.split(/ *[,;] */g);
		col.save(function (err) {
    		if (err) {
    			req.flash('new-collection', err);
      			return res.render('new-collection', {
      				collection:col
      			});
    		}
    		res.redirect(col.name);
  		});
	});

	app.get('/:collection/submissions', isLoggedIn, function(req, res, next) {
		Submission.find({catalog: req.params.collection}, function(err, subs) {
			if (err) return next(new Error('Cannot get submissions'));
			//subs = subs || [];
			res.render('submissions', {
				collection: req.collection,
				submissions: subs,
			});
		})
	});

	app.get('/:collection/edit', isLoggedIn, function(req, res, next) {
		res.render('edit-collection', {
			collection: req.collection
		});
	});

	app.post('/:collection/edit', isLoggedIn, function(req, res, next) {
		var body = req.body;
		var col = req.collection;
		if (col.owners.indexOf(req.user.name) === -1)
			next('You do not have permission to edit this collection');
		col.name = body.name.replace(' ','-');
		col.title = body.title;
		col.description = body.description;
		col.owners = body.owners.split(/ *[,;] */g);
		if (col.owners.length === 0)
			col.owners.push(req.user.name);
		col.writers = body.writers.split(/ *[,;] */g);
		col.readers = body.readers.split(/ *[,;] */g);
		col.save(function(err) {
			if (err) {
				req.flash('edit-collection', err);
      			return res.render('edit-collection', {
      				collection:col
      			});
    		}
    		res.redirect(col.name);
		})
	});

	app.param('name', function(req, res, next, name) {
		User.findOne({ 'name' :  name }, function(err, user) {
    		if (err) {
      			next(err);
    		} else if (user) {
      			req.collection = user;
      			next();
    		} else {
      			next(new Error('failed to load user'));
    		}
  		});
	});

	// Share ----------

  	function fix_utf8(o) {
  		if (o.type === 'char')
  			o.value = decodeURIComponent(escape(o.value));
  		return o;
  	}

  	//TODO: authentication check
  	app.get('/api/:cName/:docName/ops',function(req, res, next) {
	  var backend = share.backend;
	  var from = parseInt(req.query.from) || 0;
      var to = parseInt(req.query.to) || 1000;
      backend.getOps(req.params.cName,
        req.params.docName, from, to, function(err, ops) {
      	if (err) return next(err);
      	res.send(ops);
      });
    });

  	//TODO: authentication check
	app.get('/api/:cName/:docName/:rev?', function(req, res, next) {
	  var backend = share.backend;
	  backend.fetch(req.params.cName, req.params.docName, function(err, doc) {
        if (err) next(err);
        if (!doc.type) return res.status(404);
  
        var snapshot = ot.parse(decodeURIComponent(escape(doc.data)))[0];
        var v = parseInt(req.params.rev || doc.v);
        if (v > doc.v) return res.status(404, 'Unknown revision');
        var from = v;
        var to = doc.v + 1;
        backend.getOps(req.params.cName,
        	req.params.docName, from, to, function(err, ops) {
      		if (err) return next(err);
      		//TODO: rewind to snapshot
      		var op;
      		var prev = snapshot;
      		var o;
      		try {
      		  for (var i = ops.length - 1; i >= 0; i--) {
      			op = ops[i];
      			if (op.op) {
      				prev = snapshot;
      				o = ot._trim(op.op);
      				o = o.map(fix_utf8);
      				o = ot.invert(o);
      				snapshot = ot.apply(prev, o);
      			}
      		  };
      		  //console.log(o)
      		  //console.log(prev.toSexpr().replace(/'/g, '\\\''))
           	  res.send(snapshot.toSexpr());
      		} catch (e) {
      			//console.log(o)
      			//console.log(snapshot.toSexpr().replace(/'/g, '\\\''))
      			return next(e)
      		}
        });
      });
	})

	function playback(req, res, next) {
		res.send('TODO: playback ops');
	}

	app.get('/@:name/:title/playback/:range?', playback);
	app.get('/:collection/:title/playback/:range?', playback);

	function show_revision(req, res, next) {
		//req.collection -- might be a user
		res.send('TODO: render document revision');
	}

	app.get('/@:name/:title/:rev?', show_revision);
	app.get('/:collection/:title/:rev?',show_revision);

	app.get('/@:name', function(req, res, next) {
		Document.find({
  			'catalog':('@' + req.collection.name),
  			'status':'public',
  		}, function(err, docs){
  			if (err) return next(err);
    		res.render('profile', {
				user: req.collection,
				stories: (docs || []),
			});
  		});
	});

	app.param('collection', function(req, res, next, name) {
		Collection.findOne({ 'name' :  name }, function(err, collection) {
    		if (err) {
      			next(err);
    		} else if (collection) {
      			req.collection = collection;
      			next();
    		} else {
      			next(new Error('failed to load collection'));
    		}
  		});
	});

	app.get('/:collection', function(req, res) {
		Document.find({
  			'catalog':req.collection.name,
  			'status':'public',
  		}, function(err, docs){
  			if (err) return next(err);
    		res.render('collection', {
				collection: req.collection,
				stories: (docs || []),
			});
  		});
	});

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

