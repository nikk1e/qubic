var friar = require('friar');
var DOM         = friar.DOM;
var createClass = friar.createClass;

var Toolbar = createClass({
	render: function() {
		var p = this.props;
		var s = this.state;
		var d = p.store.document().toSexpr();
		return DOM.div({className:'toolbar'},[
			DOM.a({href:"#",className:"btn pull-left", onClick:p.toggleSummary},
				[DOM.em({className:"fa fa-align-justify"},"")]),
			DOM.a({href:"#",className:"btn pull-left", onClick:p.toggleSearch},
				[DOM.em({className:"fa fa-search"},"")]),
			DOM.a({href:"#",className:"btn pull-left", onClick:p.toggleInfo},
				[DOM.em({className:"fa fa-info-circle"},"")]),
			DOM.a({href:"#",className:"btn pull-left", onClick:p.toggleHistory},
				[DOM.em({className:"fa fa-history"},"")]),
			DOM.a({href:"/" + window.catalog,className:"btn pull-right"},
				[DOM.em({className:"fa fa-arrow-left"},"")]),
			p.editable ? DOM.a({href:"#",className:"btn pull-right", onClick:p.togglePublish},
				[DOM.em({className:"fa fa-cloud-upload"},"")]) : DOM.div({}),
			DOM.form({action:"/copy/" + p.docId, method:'post',className:"pull-right"},
				[DOM.input({type:'hidden', name:'sexpr', value:d}),
				 DOM.button({type:'submit',className:"btn pull-right"},
				 	[DOM.em({className:"fa fa-copy"},"")])
				]),			
			DOM.h1({},(p.title || 'Untitled')), //Put connected users here??
			]);
	},
});

module.exports = Toolbar;