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
			catalog: '',
			unlisted: false,
		};
	},
	onChange: function(e) {
		var ele = e.target.form.elements;
		this.setState({
			title: ele['title'].value || '',
			subtitle: ele['subtitle'].value || '',
			catalog: ele['catalog'].value || '',
			unlisted: ele['unlisted'].value || this.state.unlisted,
		});
	},
	onSubmit: function(e) {
		e.preventDefault();
		e.stopPropagation();
		//this.onChange(e);
		var s = this.state;
		var p = this.props;
		var catalog = s.catalog || p.catalog;
		var req = new XMLHttpRequest();
		var url = (this.isPub() ? '/publish' : '/submit') +
		  '/' + catalog + '/' + p.docId;
		//return false;
		req.onreadystatechange = function (data) {
  			// code
  			if (req.readyState == XMLHttpRequest.DONE ) {
  				if (req.status === 200)
  					console.log(data);
  				else if (req.status === 400)
  					console.log(data);
  				else
  					console.log(req.responseText);
  			}
		};
		req.open('POST', url);
		req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		var obj = {
			title:(s.title || p.title),
			slug:(s.subtitle || p.subtitle),
			text:p.doc.textContent(),
			data:p.doc.toSexpr(),
			status:(s.unlisted ? 'unlisted':'public'),
		};
		req.send(JSON.stringify(obj));
		p.togglePublish();
		return false;
	},
	isPub: function() {
		var s = this.state;
		var p = this.props;
		var catalog = s.catalog || p.catalog;
		return ((p.owns || []).indexOf(catalog) !== -1);
	},
	render: function() {
		var s = this.state;
		var p = this.props;

		var catalog = s.catalog || p.catalog;

		var title = this.isPub() ? "Publish" : "Submit";
		return DOM.div({className:"publish content"},[
			DOM.h2({},title),
			DOM.form({
				className:'pure-form pure-form-stacked pure-g',
				onChange: this.onChange,
				onSubmit: this.onSubmit,
			},[

				DOM.label({'for':'title',className:"pure-u-1"},"Title"),
				DOM.input({
					className:"pure-u-1",
					type:'text',
					placeholder:p.title,
					name:'title',
					id:'title',
					value:s.title}),
				DOM.label({'for':'subtitle',className:"pure-u-1"},"Subtitle"),
				DOM.textarea({
					className:"pure-u-1",
					placeholder:p.subtitle,
					name:'subtitle',
					id:'subtitle',
				}, s.subtitle),
				DOM.label({'for':'catalog',className:"pure-u-1"},"Catalog"),
				DOM.input({
					className:"pure-u-1",
					type:'text',
					placeholder:p.catalog,
					name:'catalog',
					id:'catalog',
					value:s.catalog,
				}),
				DOM.label({'for':'unlisted', className:"pure-u-4-5"},[
					DOM.input({
						type:'checkbox',
						id:'unlisted',
						name:'unlisted',
						value:s.unlisted
					}),
					DOM.text(" Private/Unlisted"),
				]),
				DOM.button({
					className:"pure-button pure-button-primary btn pure-u-1-5",
					type:'submit',
				},title)
			]),
		]);
	},
});

var Wrap = createClass({
	getInitialState: function() {
		return {
			doc: this.props.store.document(),
			catalog: this.props.catalog,
			sidebar: 'summary',
			search: false,
			publish: false,
			filter: '',
		};
	},
	didMount: function() {
		this.props.store.on('change', this.onChange);
		this.onChange();
	},
	willUnmount: function() {
		this.props.store.removeListener('change', this.onChange);
	},
	updateSlug: function() {
		console.log('updateSlug');
		var p = this.props;
		var s = this.state;
		var req = new XMLHttpRequest();
		//return false;
		req.onreadystatechange = function (data) {
  			// code
  			if (req.readyState == XMLHttpRequest.DONE ) {
  				if (req.status === 200)
  					console.log(req.responseText);
  				else if (req.status === 400)
  					console.log(req.responseText);
  				else
  					console.log(req.responseText);
  			}
		};
		req.open('POST', '/edit/' + p.docId);
		req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		var obj = {
			title:this.title,
			slug:this.subtitle,
		};
		console.log(JSON.stringify(obj))
		req.send(JSON.stringify(obj));
		return false;
	},
	onChange: function() {
		var p = this.props;
		var s = this.state;
		this.setState({
			doc: p.store.document()
		});
		if (p.status === 'draft') {
			var title = findTitle(s.doc);
			var subtitle = findSubtitle(s.doc);
			var self = this;
			if (this.title !== title || this.subtitle !== subtitle) {
				console.log('Titles have changed')
				this.title = title;
				this.subtitle = subtitle;
				if (this.timeout)
					clearTimeout(this.timeout);
				this.timeout = setTimeout(function() {
					self.timeout = null;
					self.updateSlug();
				}, 3000);
			}
		}
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
					docId: p.docId,
					owns: p.owns,
					catalog: s.catalog,
					title: title,
					subtitle: subtitle,
					togglePublish: this.onPublish,
				}),
				DOM.div({id:"preview"},[this.editor]),
			]),
		]);
	},
});

module.exports = Wrap;