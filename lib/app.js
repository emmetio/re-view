var breakpoint = require('./breakpoint');
var view = require('./view');
var utils = require('./utils');

var containerClass = 'emmet-re-view';
if (document.querySelector('.' + containerClass)) {
	return;
}

var container = utils.el('div', containerClass);
document.body.appendChild(container);

var f = document.createDocumentFragment();
var options = {
	maxWidth: 700
};

var bp = breakpoint.get(function(bp) {
	console.log('Emmet Re:View received breakpoints', bp);
	bp.forEach(function(b) {
		f.appendChild(view.create(location.href, b, options));
	});

	container.appendChild(f);
});