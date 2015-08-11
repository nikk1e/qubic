var Slate = require('slatejs');
var Wrap = require('./wrap');

document.addEventListener('DOMContentLoaded', function () {

	var wrapElm = document.getElementById('wrap');
    var plugins = Slate.plugins;
    var Selection = Slate.Selection;
	var Region = Slate.Region;

	var e = Slate.editor;


var dummy = new BCSocket(null, {reconnect: true});
dummy.canSendJSON = false; //need this because goog.json.serialize doesn't call toJSON

var sjs = new Slate.sharejs.Connection(dummy);
window.share_connection = sjs;
sjs.debug = true;
var sharedoc = sjs.get(docCollection,docId); //docCollection adnd docId set in the view
sharedoc.subscribe();

var editor;
var store;

var doc = '(doc (section (h1 "") (p "")))'


var sel = new Selection([new Region(7,7)]); //, new Region(298,348), new Region(380), new Region(495,400), new Region(870,830), new Region(1130,1070), new Region(1200,1300), new Region(1743+8,1734)]);

var catalog = window.catalog || 'unknown';

sharedoc.whenReady(function() {
	if (!sharedoc.type)
		sharedoc.create('sexpr', doc);
	else
		sharedoc.snapshot = Slate.type.deserialize(sharedoc.snapshot);
	store = new Slate.Store(sharedoc.createContext());

	store.select(sel);

	window.wrap = Wrap({store: store,
		catalog: catalog,
		docId: window.docId,
		owns: window.owns || [],
		status: window.docStatus || 'draft',
		plugins:[
		plugins.base,
		plugins.table,
		plugins.qube,
		plugins.encryption,
	]});

	e.friar.renderComponent(wrap, wrapElm)
});


});