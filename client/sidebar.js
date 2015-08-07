var friar = require('friar');
var DOM         = friar.DOM;
var createClass = friar.createClass;

var ot = require('ot-sexpr');
var List = ot.List;

function toHeaders(list, stack) {
	stack = stack || [];
	if (!(list instanceof List))
		return stack;

	var h = this.head().sym;
	switch (h) {
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
			stack.push({level:parseInt(h.slice(1)), text:this.textContent()});
		case 'encrypted':
			stack.push({level:0, text:'Encrypted'});
			break;
		case 'section':
		case 'encrypt':
			stack.push({level:0, text:(h === 'encrypt' ? 'Encrypted' : 'Section')});
			//fall through
		case 'doc':
			for (var i = 1; i < this.values.length; i++) {
				var child = this.values[i];
				toHeaders(child, stack);
			};
			break;
		default:
			break;
	}
	return stack;
}


var Sidebar = createClass({
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
		return DOM.div({className:'sidebar'},"THis is a sidebar");
	},
});

module.exports = Sidebar;