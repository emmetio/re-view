var breakpoint = require('./breakpoint');
var view = require('./view');
var utils = require('./utils');
var syncScroll = require('./sync-scroll');

var containerClass = 'emmet-re-view';
var activeClass = 'emmet-re-view__item_active';
var scrollViews = [];

var container = document.querySelector('.' + containerClass);

if (container) {
	container.parentNode.removeChild(container);
}

container = utils.el('div', containerClass);
document.body.appendChild(container);

var f = document.createDocumentFragment();
var options = {
	maxWidth: 700
};

breakpoint.get(function(bp) {
	console.log('Emmet Re:View received breakpoints', bp);
	var allViews = [];
	bp.forEach(function(b) {
		var v = view.create(location.href, b, options);
		allViews.push(v);
		f.appendChild(v);
	});
	container.appendChild(f);

	setTimeout(function() {
		allViews.forEach(function(v) {
			syncScroll.init(v);
		});
	}, 100);

	utils.sendMessage('viewsCreated');
});