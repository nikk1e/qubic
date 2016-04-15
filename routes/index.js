var Collection = require('../models/collection'); //org
var Document   = require('../models/document');
var User       = require('../models/user');
var ot         = require('ot-sexpr');
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

	/*
	app.post('/copy/:draftId', isLoggedIn, function(req, res, next) {
		//console.log(req)
		var copy = req.doc;
		var sexpr = req.body.sexpr;
		var id = genId();
		var doc = new Document();
		//TODO: this should be setting the revision.
		doc.parent = '/' + copy.catalog + '/' + (copy.title || Untitled).replace(/\s/g,'_') + '-' + copy._id;
		doc.hidden = true;
		doc._id = id;
		doc.catalog = '@' + req.user.name;
		doc.title = copy.title;
		doc.text = '';
		doc.slug = '';
		console.log(doc)
		doc.save(function(err) {
			if (err) return next(err);
			req.user.save(function(err) {
				if (err) return next(err);
				app.locals.backend.submit('draft',
					id, 
					{v:0, create:{type:'sexpr', data:sexpr}},
					function(err) {
						if (err) return next(err);
						res.redirect('/edit/' + id);
					}
				);
			});
		})
	})

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
	*/

	app.get('/edit/:draftId', isLoggedIn, myCollections, function(req, res, next) {
		var id = req.params.draftId;
		var user = req.user;
		var catalog = req.catalog;
		if (!req.can_edit) {
			req.local.messages = ['You do not have permission to edit this document.  It is in read-only mode.'];
			return show_revision(req, res, next);
		}
		res.render('edit', {
			title: 'Qubic',
			doc: req.doc,
			catalog: catalog,
			owns: JSON.stringify(req.owns),
			writes: JSON.stringify(req.writes),
			docId: id,
			messages: JSON.stringify(req.messages || []),
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
			next(new Error('You do not have permission to publish to this collection'));
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

	app.get('/collection/new', isLoggedIn, function(req, res) {
		var collection = new Collection();
		collection.name = '';
		collection.title = '';
		collection.description = '';
		collection.owners.push(req.user.name);
		res.render('new-collection', {collection:collection});
	});

	app.post('/collection/new', isLoggedIn, function(req, res) {
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
    		res.redirect('/'+col.name);
		})
	});



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




	app.get('/@:name/:title/:rev?', myCollections,  show_revision);
	app.get('/:collection/:title/:rev?', myCollections, show_revision);

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

