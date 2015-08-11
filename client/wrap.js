var friar = require('friar');
var DOM         = friar.DOM;
var createClass = friar.createClass;

var Toolbar = require('./toolbar');
var Sidebar = require('./sidebar');
var Slate = require('slatejs');
var Editor = Slate.editor.Editor;

function findTitle(list) {
	if (!(typeof list === 'object' && list.type === 'list')) return;
	var h = list.head().sym;

	switch (h) {
		case 'h1':
		case 'h2':
			return list.textContent();
		case 'section':
		case 'doc':
		    if (list.attributes && list.attributes.title) return list.attributes.title;
			for (var i = 1; i < list.values.length; i++) {
				var child = list.values[i];
				var t = findTitle(child);
				if (t) return t;
			};
		default:
			return;
	}
}

function findSubtitle(list) {
	if (!(typeof list === 'object' && list.type === 'list')) return;
	var h = list.head().sym;

	switch (h) {
		case 'p':
		case 'h2':
		case 'h3':
		case 'blockquote':
		case 'quote':
			return list.textContent();
		case 'section':
			for (var i = 1; i < list.values.length; i++) {
				var child = list.values[i];
				var t = findTitle(child);
				if (t) break;
			};
			for (i++; i < list.values.length; i++) {
				var child = list.values[i];
				var t = findSubtitle(child);
				if (t) return t;
			};
			return;
		case 'doc':
		    if (list.attributes && list.attributes.subtitle) return list.attributes.subtitle;
			for (var i = 1; i < list.values.length; i++) {
				var child = list.values[i];
				var t = findSubtitle(child);
				if (t) return t;
			};
		default:
			return;
	}
}


var Publish = createClass({
	getInitialState: function() {
		var doc = this.props.doc;
		return {
			title: '',
			subtitle: '',
			category: '',
			unlisted: false,
		};
	},
	render: function() {
		var s = this.state;
		var p = this.props;
		return DOM.div({className:"publish content"},[
			DOM.h2({},"Publish"),
			DOM.form({className:'pure-form pure-form-stacked pure-g'},[
				DOM.input({
					className:"pure-u-1",
					type:'text',
					placeholder:p.title,
					name:'title',
					value:s.title}),
				DOM.textarea({
					className:"pure-u-1",
					placeholder:p.subtitle,
					name:'subtitle'
				}, s.subtitle),
				DOM.input({
					className:"pure-u-1",
					type:'text',
					placeholder:'Category',
					name:'category',
					value:s.category
				}),
				DOM.label({'for':'unlisted', className:"pure-u-4-5"},[
					DOM.input({
						type:'checkbox',
						id:'unlisted',
						name:'unlisted',
						value:s.unlisted
					}),
					DOM.text(" Private"),
				]),
				DOM.button({
					className:"pure-button pure-button-primary btn pure-u-1-5",
					type:'submit',
				},"Publish")
			]),
		]);
	},
});

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
		var title = findTitle(s.doc);
		var subtitle = findSubtitle(s.doc);
		var bcname = "book-content";
		if (s.publish)
			bcname += ' with-publish';
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
			DOM.div({id:"book-content", className:bcname},[
				Toolbar({
					id: "toolbar",
					className: "toolbar",
					title: title,
					toggleSummary: this.onSummary,
					toggleInfo: this.onInfo,
					toggleHistory: this.onHistory,
					toggleSearch: this.onSearch,
					togglePublish: this.onPublish,
				}),
				Publish({
					doc:s.doc,
					title: title,
					subtitle: subtitle,
				}),
				DOM.div({id:"preview"},[this.editor]),
			]),
		]);
	},
});

module.exports = Wrap;