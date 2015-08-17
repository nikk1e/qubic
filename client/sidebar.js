var friar = require('friar');
var DOM         = friar.DOM;
var createClass = friar.createClass;

var ot = require('ot-sexpr');
var List = ot.List;

function toHeaders(list, filter, stack, num) {
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
	var show = !(filter && !(filter.test(list.textContent())))
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
		    if (show)
				stack.push({level:lvl, text:list.textContent(), id:list.id, num:num.slice(1,lvl+1).join('.')});
			//console.log(stack)
			break;
		case 'encrypted':
			num[0]++;
			clearAfter(0);
			if (show)
				stack.push({level:0, text:'Section', id:list.id, num:Roman(num[0]), tag:'lock'});
			break;
		case 'section':
		case 'encrypt':
		    num[0]++;
			clearAfter(0);
			var el = {level:0, text:'Section', id:list.id, num:Roman(num[0])}
			if (h === 'encrypt')
				el.tag ='unlock';
			if (show)
				stack.push(el);
			//fall through
		case 'doc':
			for (var i = 1; i < list.values.length; i++) {
				var child = list.values[i];
				toHeaders(child, filter, stack, num);
			};
			break;
		default:
			if (filter && show)
				stack.push({level:6, text:list.textContent(), id:list.id, num:''});
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

var Summary = createClass({
	render: function() {
		var p = this.props;
		var doc = p.doc;
		var filter;
		if (p.filter && p.filter.length >= 3)
			try {
				filter = new RegExp(p.filter,'ig');
			} catch(e) {
				console.log(e);
			}
		var hs = toHeaders(doc, filter);
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
		return DOM.ul({className:"summary"},cs);
	},
});

var Info = createClass({
	render: function() {
		return DOM.div({className:"info"},"Info goes here");
	}
});

var History = createClass({
	render: function() {
		return DOM.div({className:"history"},"History goes here");
	}
});

var Sidebar = createClass({
	render: function() {
		var doc = this.props.doc;
		
		var p = this.props;
		var showSearch = !!p.search;
		var cname = 'sidebar';
		if (showSearch && p.show === 'summary')
			cname += ' with-search';

		var Show = Summary;
		switch (p.show) {
			case 'info':
				Show = Info;
				break;
			case 'history':
				Show = History;
				break;
		}
		
		return DOM.div({id:this.props.id, className:cname},[
			DOM.div({className:"book-search"},[
				DOM.input({
					type:"text",
					placeholder:"Type to search",
					className:"form-control",
					//onChange: p.onSearchChange,
					onKeyup: p.onSearchChange,
					value: p.filter,
					}),
				]),
			Show({filter:p.filter, doc:doc}),
			]);
	},
});

module.exports = Sidebar;