var friar = require('friar');
var DOM         = friar.DOM;
var createClass = friar.createClass;

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
		return DOM.div({className:'toolbar'},[
			DOM.a({href:"#",className:"btn pull-left"},
				[DOM.em({className:"fa fa-align-justify"},"")]),
			DOM.a({href:"#",className:"btn pull-left"},
				[DOM.em({className:"fa fa-search"},"")]),
			DOM.a({href:"#",className:"btn pull-left"},
				[DOM.em({className:"fa fa-info-circle"},"")]),
			DOM.a({href:"#",className:"btn pull-left"},
				[DOM.em({className:"fa fa-history"},"")]),
			DOM.a({href:"#",className:"btn pull-right"},
				[DOM.em({className:"fa fa-user"},"")]),
			DOM.a({href:"#",className:"btn pull-right"},
				[DOM.em({className:"fa fa-cloud-upload"},"")]),
			]);
	},
});

module.exports = Toolbar;