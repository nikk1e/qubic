var sharejs = require('share');

module.exports = (backend) => {
	const share = sharejs.server.createClient({backend: backend});
	share.use(function(req, next) {
	  //TODO: op filter for share docs here
	  next();
	});
	
	var pv = {}
	share.preValidate = function(op, doc) {
	  if (op.op != undefined) {
	    pv[doc.docName + ':' + doc.v] = doc.data.toSexpr()
	  }
	}
	
	share.validate = function(op, doc) {
	  if (op.op != undefined) {
	    try {
	      var key = doc.docName + ':' + doc.v;
	      var prevSS = pv[key];
	      delete pv[key];
	      var o = ot.invert(op.op);
	      var prev = ot.apply(doc.data, o);
	      var prevS = prev.toSexpr();
	      if (prevSS != prevS) {
	        return 'Inverse does not match original';
	      }
	    } catch(e) {
	      console.log(e)
	      return "Could not invert op";
	    }
	  }
	  return;
	};

	//return ops in range
	function ops(req, res, next) {
	  var from = parseInt(req.query.from) || 0;
      var to = parseInt(req.query.to) || 1000;
      backend.getOps(req.params.cName,
        req.params.docName, from, to, function(err, ops) {
      	if (err) return next(err);
      	res.send(ops);
      });
    }

    function history(req, res, next) {
    	var cName = req.params.cName;
    	var docName = req.params.docName;
    	backend.fetch(cName, docName, function(err, doc) {
        	if (err) return next(err);
        	if (!doc.type) return next('Unknown file');
        	var to = parseInt(req.params.rev || doc.v);
        	var from = to - 10000;
        	if (from <= 0) from = 1;
        	backend.getOps(cName,
        		docName, from, to, function(err, ops) {
      			if (err) return next(err);
      			var hist = [];
      			var last;
      			for (var i = ops.length - 1; i >= 0; i--) {
      				var op = ops[i];
      				var date = new Date(op.m.ts);
      				var d = date.valueOf()
      				if (last == undefined || d < (last - (15*60000)) ) {
      					hist.push({date:date.toISOString(), v:op.v});
      					last = d;
      				}
      			}
      			res.send({to:to, from:from, history:hist});
      		});
    	});
    }

    function revision(cName, docName, rev, next) {
    	var backend = share.backend;
    	console.log(cName)
    	console.log(docName)
    	backend.fetch(cName, docName, function(err, doc) {
        if (err) return next(err);
        if (!doc.type) return next('Unknown file');
        var snapshot = ot.parse(doc.data)[0];
        var v = parseInt(rev || doc.v);
        if (v > doc.v) return next('Unknown revision');
        var from = v;
        var to = doc.v + 1;
        backend.getOps(cName,
        	docName, from, to, function(err, ops) {
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
      				console.log(o)
      				o = o.map(fix_utf8);
      				o = ot.invert(o);
      				snapshot = ot.apply(prev, o);
      			}
      		  };
           	  return next(null, snapshot); // return the snapshot
      		} catch (e) {
      			console.log(o)
      			console.log(snapshot.toSexpr())
      			return next(e)
      		}
        });
      });
    }

	return {
		client: share,
		ops,
		history,
		revision
	}
}