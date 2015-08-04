var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');

var hat          = require('hat'); 

//var session      = require('express-session');
var session      = require('cookie-session')

var livedb       = require('livedb');
var livedbMongo  = require('livedb-mongo');
var Socket       = require('browserchannel').server;
var Duplex       = require('stream').Duplex;

var mongoose     = require('mongoose');
var passport     = require('passport');
var flash        = require('connect-flash');

require('./config/passport')(passport);

var app = express();

var ot = require('ot-sexpr');
var sharejs = require('share');

livedb.ot.registerType(ot);

var MONGODB_URL = 'mongodb://localhost:27017/qube?auto_reconnect'

//we have two connections to mongodb
mongoose.connect(MONGODB_URL);
var db = livedbMongo(MONGODB_URL, {safe:false});
var backend = livedb.client(db);
var share = sharejs.server.createClient({backend: backend});


share.use(function(req, next) {
  //TODO: op filter for share docs here
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// required for passport
var session_secret = process.env.QUBE_SESSION_SECRET ||
  'OIU9083029ksdflkj2930ljlksdfj293080293';
app.use(session({ secret: session_secret }));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());
//allow req access from templates
app.use(function(req,res,next){
    res.locals.req = req;
    res.locals.user = req.user;
    next();
});

//sharejs websocket hookup
app.use(Socket(function(client, req) {
  if (req.user) {
    client.user = req.user;
  }
  
  var stream = new Duplex({objectMode: true});

  stream._read = function() {};
  stream._write = function(chunk, encoding, callback) {
    if (client.state !== 'closed') {
      client.send(chunk);
    }
    callback();
  };

  client.on('message', function(data) {
    console.log(JSON.stringify(data))
    stream.push(data);
  });

  client.on('close', function(reason) {
    stream.push(null);
    stream.emit('close');
  });

  stream.on('end', function() {
    client.close();
  });

  // Give the stream to sharejs
  return share.listen(stream, client);
}));

// provide rack for ids (new rack every 2 hours)
var MILLISECONDS_PER_RACK = 1000 * 60 * 60 * 2;
var INITIAL_RACK = 1428821798083; //epoch for ids.

function rackHour(ut) {
  return Math.floor((ut - INITIAL_RACK) / MILLISECONDS_PER_RACK);
}

app.locals.lastRack = Date.now();
app.locals.rackHour = rackHour(app.locals.lastRack);
app.locals.rack     = hat.rack(36,36);
app.use(function(req,res,next){
    var now = Date.now();
    if ((now - MILLISECONDS_PER_RACK) > app.locals.lastRack) {
      app.locals.lastRack = now;
      app.locals.rackHour = rackHour(now);
      app.locals.rack = hat.rack(36,36);
    }
    next();
});

require('./routes/index')(app, passport);
var admin = require('./routes/admin');
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

