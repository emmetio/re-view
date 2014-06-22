var breakpoints = require('../breakpoint');
var view = require('../view');
var ui = require('../ui');
var event = require('../event');
var preferences = require('../preferences');
var utils = require('../utils');
var syncScroll = require('../sync-scroll');
var eventRouter = require('../event-router');
var chromeUtils = require('./utils');

// the domain key used to store user preferences
var DOMAIN = location.href;
var allBreakpoints = null;
var allViews = null;
var uiContainer = null;
var defaultPreferences = {
	maxWidthEnabled: true,
	maxWidth: 700,
	syncScroll: true
};

function initMainView(bp) {
	var skipped = preferences.get('skipBreakpoints', []);
	bp = bp.filter(function(b) {
		return !~skipped.indexOf(b.id);
	});

	allViews = view.init(location.href, bp, uiContainer, viewOptions());

	// update views sizes, if required
	setTimeout(function() {
		updateAllViews();
		allViews.forEach(function(v) {
			syncScroll.init(v);
		});
	}, 1);
}

function reset() {
	while (allViews.length) {
		view.remove(allViews.pop());
	}
	localStorage.removeItem('emr');
	preferences.load(defaultPreferences);
	initMainView(allBreakpoints);
}

function viewOptions(v) {
	var options = {};
	if (preferences.get('maxWidthEnabled')) {
		options.maxWidth = preferences.get('maxWidth');
	}

	if (v) {
		var widths = preferences.get('breakpointWidths', {});
		var bp = view.breakpointForView(v);
		if (bp.id in widths) {
			options.width = widths[bp.id];
		}
	}

	return options;
}

function updateAllViews() {
	allViews.forEach(function(v) {
		view.update(v, viewOptions(v));
	});
}

function loadCSS(url, callback) {
	chromeUtils.sendMessage('loadCSS', {url: url}, function(response) {
		if (response.err) {
			console.log(response.err);
			return callback(null);
		}

		var ast = response.ast;
		if (typeof ast === 'string') {
			ast = JSON.parse(ast);
		}
		callback(ast);
	});
}

function hideUI(evt) {
	if (evt && evt.keyCode !== 27) {
		return;
	}

	ui.remove();
	document.removeEventListener('keyup', hideUI);
}

// route events
eventRouter.setup({
	updateViews: utils.throttle(updateAllViews, 100),
	savePreferences: utils.throttle(function() {
		var data = {};
		data[DOMAIN] = preferences.dump();
		chrome.storage.local.set(data);
	}, 100),
	reset: reset
});

event.on('view:remove', function(v) {
	if (~allViews.indexOf(v)) {
		allViews.splice(allViews.indexOf(v), 1);
	}
});



// start the app
chrome.storage.local.get(DOMAIN, function(data) {
	preferences.load(data[DOMAIN] || defaultPreferences);
	uiContainer = ui.currentUI();
	if (uiContainer) {
		// UI view already created, remove it
		return hideUI();
	}

	document.addEventListener('keyup', hideUI, false);

	uiContainer = ui.create({
		panel: true,
		maxWidth: {
			enabled: preferences.get('maxWidthEnabled'),
			value: preferences.get('maxWidth')
		},
		syncScroll: preferences.get('syncScroll'),
		reset: true
	});
	document.body.appendChild(uiContainer);
	breakpoints.get({loadCSS: loadCSS}, function(bp) {
		console.log('Emmet Re:View received breakpoints', bp);
		allBreakpoints = bp;
		initMainView(bp);
	});
});