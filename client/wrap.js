var friar = require('friar');
var DOM         = friar.DOM;
var createClass = friar.createClass;

var Toolbar = require('./toolbar');
var Sidebar = require('./sidebar');
var Slate = require('slatejs');
var Editor = Slate.editor.Editor;

var Wrap = createClass({
	getInitialState: function() {
		return {
			doc: this.props.store.document(),
			sidebar: 'summary',
			search: false,
			publish: false,
			filter: '',
		};
	},
	didMount: function() {
		this.props.store.on('change', this.onChange);
	},
	willUnmount: function() {
		this.props.store.removeListener('change', this.onChange);
	},
	onChange: function() {
		this.setState({
			doc: this.props.store.document()
		});
	},
	toggleSidebar: function(n) {
		var s = this.state;
		this.setState({sidebar:(s.sidebar === n ? 'none' : n )});
	},
	onSummary: function() {
		this.toggleSidebar('summary');
	},
	onInfo: function() {
		this.toggleSidebar('info');
	},
	onHistory: function() {
		this.toggleSidebar('history');
	},
	onSearch: function() {
		if (!this.state.search)
			this.setState({sidebar:'summary', search:true, filter:''});
		else
			this.setState({search:false, filter:''});
	},
	onSearchChange: function(e) {
		this.setState({filter:e.target.value});
	},
	onPublish: function() {
		this.setState({publish:(!(this.state.publish))});
	},
	render: function() {
		var p = this.props;
		var s = this.state;
		var cname = 'book ' + s.sidebar;
		this.editor = Editor({
			id: "preview",
			store: p.store,
			plugins: p.plugins,
		});
		var main = [Toolbar({
			id: "toolbar",
			className: "toolbar",
			store: p.store,
			toggleSummary: this.onSummary,
			toggleInfo: this.onInfo,
			toggleHistory: this.onHistory,
			toggleSearch: this.onSearch,
			togglePublish: this.onPublish,
		})];
		//if drawer
		// main.push(...)
		main.push(DOM.div({id:"preview"},[this.editor]));
		return DOM.div({className:cname}, [
			Sidebar({
				id:"sidebar",
				show:s.sidebar,
				search:s.search,
				doc:s.doc,
				store:p.store,
				onSearchChange:this.onSearchChange,
				filter:s.filter,
			}),
			DOM.div({id:"book-content", className:"book-content"},main),
			]);
	},
});

module.exports = Wrap;