var breakpoint = require('./breakpoint');
var view = require('./view');
var utils = require('./utils');
var syncScroll = require('./sync-scroll');

var containerClass = 'emmet-re-view';
var activeClass = 'emmet-re-view__item_active';
var breakpointViews = null;
var viewOptions = {
	maxWidth: 700
};

function hideMainView(container) {
	if (container && container.parentNode) {
		container.parentNode.removeChild(container);
	}
}

function createMainView() {
	return utils.el('div', containerClass);
}

function init() {
	var container = document.querySelector('.' + containerClass);
	if (container) {
		// view already created
		return hideMainView(container);
	}

	container = createMainView();
	document.body.appendChild(container);

	breakpoint.get(function(bp) {
		console.log('Emmet Re:View received breakpoints', bp);
		breakpointViews = view.init(location.href, bp, container, viewOptions);
		setTimeout(function() {
			breakpointViews.forEach(function(v) {
				syncScroll.init(v);
			});
		}, 100);

		utils.sendMessage('viewsCreated');
	});
}

init();