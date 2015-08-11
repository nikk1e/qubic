var friar = require('friar');
var DOM         = friar.DOM;
var createClass = friar.createClass;

var ot = require('ot-sexpr');
var List = ot.List;

function toHeaders(list, stack, num) {
	stack = stack || [];
	num = num || [0,0,0,0,0,0,0];
	level = 0;
	for (var i = num.length - 1; i >= 0; i--) {
		if (num[i] > 0) {
			level = i;
			break;
		}
	};

	//console.log(list)
	//console.log(list instanceof List)

	if (!(typeof list === 'object'))
		return stack;

	function clearAfter(l) {
		for (var i = num.length - 1; i > l; i--)
			num[i] = 0;
	}

	//console.log("toHeaders")
	//console.log(list.head)
	var h = list.head().sym;
	switch (h) {
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
		    var lvl = parseInt(h.slice(1));
		    if (lvl < level) clearAfter(lvl);
		    num[lvl]++;
			stack.push({level:lvl, text:list.textContent(), id:list.id, num:num.slice(1,lvl+1).join('.')});
			//console.log(stack)
			break;
		case 'encrypted':
			num[0]++;
			clearAfter(0);
			stack.push({level:0, text:'Section', id:list.id, num:Roman(num[0]), tag:'lock'});
			break;
		case 'section':
		case 'encrypt':
		    num[0]++;
			clearAfter(0);
			var el = {level:0, text:'Section', id:list.id, num:Roman(num[0])}
			if (h === 'encrypt')
				el.tag ='unlock';
			stack.push(el);
			//fall through
		case 'doc':
			for (var i = 1; i < list.values.length; i++) {
				var child = list.values[i];
				toHeaders(child, stack, num);
			};
			break;
		default:
			break;
	}
	return stack;
}

function toRef(id) {
	return "#clay:" + id.toString(36);
}

//really noddy but will do for now
var ROMAN = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII'];
function Roman(n) {
	return ROMAN[n] || n;
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
		var doc = this.state.doc;
		var hs = toHeaders(doc);
		var p = this.props;
		var cs = hs.map(function(it) {
			var cels = [
			DOM.span({},it.text),
			]
			if (it.level === 0)
				cels.push(DOM.span({},' ' + it.num));
			else
				cels.unshift(DOM.span({}, it.num + ' '));
			if (it.tag) {
				cels.push(DOM.span({className:("fa fa-" + it.tag)},""));
			}
			return DOM.li({},[
				DOM.a({href:toRef(it.id)},cels),
				]);
		})
		return DOM.div({id:this.props.id, className:'sidebar'},[
			DOM.ul({className:"summary"},cs),
			]);
	},
});

module.exports = Sidebar;