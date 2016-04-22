var Slate = require('slatejs');
var Wrap = require('./wrap');
window.Wrap = Wrap;
window.Slate = Slate;

document.addEventListener('DOMContentLoaded', function () {

    var wrapElm = document.getElementById('wrap');
    var plugins = Slate.plugins;
    var Selection = Slate.Selection;
	var Region = Slate.Region;
	var e = Slate.editor;

	if(docMode=='edit'){
		var dummy = new BCSocket(null, {reconnect: true});
		dummy.canSendJSON = false; //need this because goog.json.serialize doesn't call toJSON	
	} else {
		var dummy = new Slate.Dummy(Slate.ottypes);
	}

	var sjs = new Slate.sharejs.Connection(dummy);
	window.share_connection = sjs;
	sjs.debug = true;
	var sharedoc = sjs.get(docCollection, docId); //docCollection and docId set in the view
	sharedoc.subscribe();

	var editor;
	var store;

	var doc = window.docSexpr || '(doc (section (h1 "") (p "")))';

	var sel = new Selection([new Region(7,7)]);	

	var catalog = window.catalog || 'unknown';

	sharedoc.whenReady(function() {
		if (!sharedoc.type) {
			sharedoc.create('sexpr', doc);
		}
		else {
			sharedoc.snapshot = Slate.type.deserialize(sharedoc.snapshot);
		}
		store = new Slate.Store(sharedoc.createContext(), Slate.type);
		store.select(sel);
		window.wrap = Wrap({store: store,
			sharedoc: sharedoc,
			catalog: catalog,
			defaultCatalog: window.defaultCatalog,
			docId: window.docId,
			owns: window.owns || [],
			status: window.docStatus || 'private',
			messages: window.messages || [],
			readonly: window.readonly,
			url: window.url || ('/' + catalog + '/' + window.docId),
		});

		try {
			e.friar.renderComponent(wrap, wrapElm);
		} catch (e) {
			console.log('Failed at render')
			console.log(e);
		}
	});	
});