document.addEventListener('DOMContentLoaded', function () {
    var Slate = require('slatejs');
    var preview = document.getElementById('preview');
    var plugins = Slate.plugins;
    var Selection = Slate.Selection;
	var Region = Slate.Region;

	var e = Slate.editor;

var dummy = new BCSocket(null, {reconnect: true});
dummy.canSendJSON = false; //need this because goog.json.serialize doesn't call toJSON

var sjs = new Slate.sharejs.Connection(dummy);
sjs.debug = true;
var sharedoc = sjs.get(docCollection,docId); //docCollection adnd docId set in the view
sharedoc.subscribe();

var editor;
var store;

var doc = '(doc (section ' +
	'(p "") ' + //empty paragraph at start for testing
	'{"headerRows":1}(table '+
		'(row (cell "Cat[]=") (cell "Qube[]") (cell "Other[]") (cell "`Extra")) ' +
		'(row (cell "First") (cell "99") (cell "100") (cell)) ' +
		'(row (cell "Second") (cell "199") (cell "200") (cell)) ' +
		'(row (cell "Third") (cell "299") (cell "300") (cell)) ' +
	') ' + //end table
	'(h1 "Welcome to SlateJS") ' +
	'(p "Welcome to your editor.") ' +
	'(p [[76,{}],[2,{"sub":true}],[24,{}],[2,{"sup":true}],[76,{}],[16,{"href":"http://google.co.uk"}],[177,{}]]"Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corrupti, aliquid ex necessitatibus repellatTM a illo fuga dolore aperiam totam tempore nisi neque delectus labore, nihil quae dignissimos dolores mollitia? Vel sunt neque voluptatibus excepturi laboriosam possimus adipisci quidem dolores, omnis nemo dolore eligendi blanditiis, voluptatem in doloribus hic aperiam.") ' + 
	'{"alignments":["left","right"]}(table '+
		'(row (cell "Some text to go in the cell") (cell "Header2")) ' +
		'(row (cell [[29,{}],[28,{"strong":true}],[17,{"strong":true,"em":true}],[20,{"em":true}]]"Text this is not bold before Some bold text to go in the bold italic cell. and not bold after.") {"rowSpan":2}(cell "99")) ' +
		'(row (cell [[29,{}],[28,{"strong":true}],[17,{"strong":true,"em":true}],[20,{"em":true}]]"Text this is not bold before Some bold text to go in the bold italic cell. and not bold after.")) ' +
		'(row {"colSpan":2}(cell [[29,{}],[28,{"strong":true}],[17,{"strong":true,"em":true}],[20,{"em":true}]]"Text this is not bold before Some bold text to go in the bold italic cell. and not bold after.")) ' +
	') ' + //end table
    '(p "") ' + 
    '{"alignments":["left","right"]}(table '+
		'(row (cell "Some text to go in the cell") (cell "Header2")) ' +
		'(row (cell [[29,{}],[28,{"strong":true}],[17,{"strong":true,"em":true}],[20,{"em":true}]]"Text this is not bold before Some bold text to go in the bold italic cell. and not bold after.") {"rowSpan":2}(cell "99")) ' +
		'(row (cell [[29,{}],[28,{"strong":true}],[17,{"strong":true,"em":true}],[20,{"em":true}]]"Text this is not bold before Some bold text to go in the bold italic cell. and not bold after.")) ' +
		'(row {"colSpan":2}(cell [[29,{}],[28,{"strong":true}],[17,{"strong":true,"em":true}],[20,{"em":true}]]"Text this is not bold before Some bold text to go in the bold italic cell. and not bold after.")) ' +
	') ' + //end table
	'(p "") ' + //paragraph we need at the end of a section
	') (section ' +
	'(h1 "Another Section") ' +
	'(p "Another paragraph in a another section") ' +
	'(code "Another = Qube * Other + 5") ' +
	'(code "Extra[Cat=First] = 77") ' +
	'(code "Extra = 88") ' +
	'(code "Test[Cat=First] = 123456") ' +
	'(code "Another[Cat=First]") ' +
	'(code "Qube[Cat=First]") ' +
	'(ulli "First list item") ' +
	'{"indent":2}(ulli "First sub list item") ' +
	'{"indent":3}(ulli "First sub sub list item") ' +
	'(ulli "Second list item") ' +
	'{"indent":2}(ulli "First sub list item") ' +
	'{"indent":2}(ulli "Second sub list item") ' +
	'(olli "First list item") ' +
	'{"indent":2}(olli "First sub list item") ' +
	'{"indent":2}(olli "Second sub list item") ' +
	'(olli "Second list item") ' +
	//'{"indent":3}(olli "First and only double sub list item") ' +
	'(blockquote "This is a really important quote.") ' +
	'(pullquote "This is another really important quote.") ' +
    '{"alignments":["left","right"], "headerRows":1}(table '+
		'(row (cell "Some text to go in the cell") (cell "Header2")) ' +
		'(row (cell [[29,{}],[28,{"strong":true}],[17,{"strong":true,"em":true}],[20,{"em":true}]]"Text this is not bold before Some bold text to go in the bold italic cell. and not bold after.") {"rowSpan":2}(cell "99")) ' +
		'(row (cell [[29,{}],[28,{"strong":true}],[17,{"strong":true,"em":true}],[20,{"em":true}]]"Text this is not bold before Some bold text to go in the bold italic cell. and not bold after.")) ' +
		'(row {"colSpan":2}(cell [[29,{}],[28,{"strong":true}],[17,{"strong":true,"em":true}],[20,{"em":true}]]"Text this is not bold before Some bold text to go in the bold italic cell. and not bold after.")) ' +
	') ' + //end table
	'(result (p "paragraph in a result"))' +
	'(p "") ' + //empty paragraph we need at the end.
	'))'


var sel = new Selection([new Region(12,9)]); //, new Region(298,348), new Region(380), new Region(495,400), new Region(870,830), new Region(1130,1070), new Region(1200,1300), new Region(1743+8,1734)]);

sharedoc.whenReady(function() {
	if (!sharedoc.type)
		sharedoc.create('sexpr', doc);
	else
		sharedoc.snapshot = Slate.type.deserialize(sharedoc.snapshot);
	store = new Slate.Store(sharedoc.createContext());

	store.select(sel);
	editor = e.Editor({store: store, plugins:[
		plugins.base,
		plugins.table,
		plugins.qube,
		plugins.encryption,
	]});

	e.friar.renderComponent(editor, preview);
});


});