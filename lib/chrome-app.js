var breakpoint = require('./breakpoint');
var ui = require('./ui');
var view = require('./view');
var utils = require('./utils');
var syncScroll = require('./sync-scroll');

var breakpointViews = null;
var viewOptions = {
	maxWidth: 700
};

function init() {
	var container = ui.currentUI();
	if (container) {
		// UI view already created, remove it
		return ui.remove(container);
	}

	container = ui.create();
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