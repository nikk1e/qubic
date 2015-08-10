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
		return DOM.div({className:'toolbar'},"THis is a toolbar");
	},
});

module.exports = Toolbar;