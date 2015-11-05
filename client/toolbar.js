var friar = require('friar');
var DOM         = friar.DOM;
var createClass = friar.createClass;

var Toolbar = createClass({
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
			p.renderPublish ? DOM.a({href:"#",className:"btn pull-right", onClick:p.togglePublish},
				[DOM.em({className:"fa fa-cloud-upload"},"")]) : DOM.div({}),
			DOM.h1({},(p.title || 'Untitled')),
			]);
	},
});

module.exports = Toolbar;