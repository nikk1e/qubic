var friar = require('friar');
var DOM         = friar.DOM;
var createClass = friar.createClass;

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

var Toolbar = createClass({
	getInitialState: function() {
		return {
			doc: this.props.store.document()
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
	render: function() {
		var p = this.props;
		return DOM.div({className:'toolbar'},[
			DOM.a({href:"#",className:"btn pull-left", onClick:p.toggleSummary},
				[DOM.em({className:"fa fa-align-justify"},"")]),
			DOM.a({href:"#",className:"btn pull-left", onClick:p.toggleSearch},
				[DOM.em({className:"fa fa-search"},"")]),
			DOM.a({href:"#",className:"btn pull-left", onClick:p.toggleInfo},
				[DOM.em({className:"fa fa-info-circle"},"")]),
			DOM.a({href:"#",className:"btn pull-left", onClick:p.toggleHistory},
				[DOM.em({className:"fa fa-history"},"")]),
			DOM.a({href:"/me/models",className:"btn pull-right"},
				[DOM.em({className:"fa fa-user"},"")]),
			DOM.a({href:"#",className:"btn pull-right", onClick:p.togglePublish},
				[DOM.em({className:"fa fa-cloud-upload"},"")]),
			DOM.h1({},(findTitle(this.state.doc) || 'Untitled')),
			]);
	},
});

module.exports = Toolbar;