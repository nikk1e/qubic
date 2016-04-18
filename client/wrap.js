var friar = require('friar');
var DOM         = friar.DOM;
var createClass = friar.createClass;

var Toolbar = require('./toolbar');
var Sidebar = require('./sidebar');
var Slate = require('slatejs');
var plugins = Slate.plugins;
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

var Messages = createClass({
	onMessage: function() {
		var s = this.state;
		var p = this.props;
		this.setState({acknowledged:true});
	},
	render: function() {
		var s = this.state;
		var p = this.props;
		p.messages = p.messages || [];
		var self = this;

		if(s.acknowledged || p.acknowledged || p.messages.length == 0) {
			if (this.timeout)
				clearTimeout(this.timeout);
			return DOM.div({});
		}

		this.timeout = setTimeout(function() {
			self.timeout = null;
			self.setState({acknowledged:true});
		}, 10000);

		return DOM.div({className:"content message"},[
				DOM.div({className:"pure-u-1"},[
					DOM.a({href:"#",className:"btn pull-right", onClick:p.toggleMessages},
					[DOM.em({className:"fa fa-times"},"")]),
					DOM.div({},	p.messages.map(function(msg){
									return DOM.p({},msg);
								})),
				]),
		])
	},
});

var Publish = createClass({
	getInitialState: function() {
		var doc = this.props.doc;
		return {
			title: '',
			subtitle: '',
			catalog: '',
			unlisted: (this.props.status === 'unlisted'),
		};
	},
	onChange: function(e) {
		var ele = e.target.form.elements;
		this.setState({
			title: ele['title'].value || '',
			subtitle: ele['subtitle'].value || '',
			catalog: ele['catalog'].value || '',
			unlisted: !!ele['unlisted'].checked,
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
		return p.owns;
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
						checked: (s.unlisted ? 'checked' : undefined),
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
			editable: (docMode === 'edit'),
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
		var doc = p.store.document()
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
		req.open('POST', p.url);
		req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		var obj = {
			title:findTitle(doc),
			slug:findSubtitle(doc),
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
		//Update the document (TODO: don't do this if paused)
		if (this.timeout) //unless we have more than a minutes changes to save
			clearTimeout(this.timeout);
		var self = this;
		this.timeout = setTimeout(function() {
			self.timeout = null;
			self.updateSlug();
		}, 1000); //TODO: 0 if we have more than 1 minutes changes to save.
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
	onMessageAck: function() {
		this.setState({acknowledged:true});
	},
	render: function() {
		var p = this.props;
		var s = this.state;
		var cname = 'book ' + s.sidebar;
		this.editor = Editor({
			id: "preview",
			store: p.store,
			plugins: [
				plugins.base,
				plugins.table,
				plugins.qube,
				plugins.encryption,
			],
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
					editable: s.editable,
					docId: p.docId,
					catalog: s.catalog,
					store: p.store,
				}),
				s.editable ? 
				Publish({
					doc:s.doc,
					docId: p.docId,
					owns: p.owns,
					catalog: s.catalog,
					title: title,
					status: p.status,
					subtitle: subtitle,
					togglePublish: this.onPublish,
				}) : DOM.div({}),
				Messages({
					acknowledged: s.acknowledged,
					messages: p.messages,
					toggleMessages: this.onMessageAck,
				}),
				DOM.div({id:"preview"},[this.editor]),
			]),
		]);
	},
});

module.exports = Wrap;