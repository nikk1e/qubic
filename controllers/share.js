var ot = require('ot-sexpr');

module.exports = function(backend){

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

    function revision(cName, docName, rev, next) {
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
		ops:ops,
		history:history,
		revision:revision
	}
}