var breakpoints = require('../breakpoint');
var view = require('../view');
var ui = require('../ui');
var event = require('../event');
var preferences = require('../preferences');
var utils = require('../utils');
var syncScroll = require('../sync-scroll');
var overrideScroll = require('../override-scroll');
var eventRouter = require('../event-router');
var serializer = require('../serializer');
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
	if (!bp || !bp.length) {
		return uiContainer.classList.add('emmet-re-view_error');
	}

	var skipped = preferences.get('skipBreakpoints', []);
	bp = bp.filter(function(b) {
		return !~skipped.indexOf(b.id);
	});

	var url = location.href;
	var fragment = document.createDocumentFragment();
	allViews = bp.map(function(b) {
		var v = view.create(url, b, viewOptions(b));
		fragment.appendChild(v);
		return v;
	})
	ui.scroller(uiContainer).appendChild(fragment);

	// update views sizes, if required
	setTimeout(function() {
		// updateAllViews();
		allViews.forEach(function(v) {
			syncScroll.init(v);
		});

		if (preferences.get('overrideScroll')) {
			overrideScroll.enable(ui.scroller(uiContainer));
		}
	}, 100);
}

function reset() {
	while (allViews.length) {
		view.remove(allViews.pop());
	}
	overrideScroll.disable();
	preferences.load(defaultPreferences, {overrideScroll: overrideScroll.guessState()});
	savePreferences();
	initMainView(allBreakpoints);
}

function viewOptions(bp) {
	var options = {};
	if (preferences.get('maxWidthEnabled')) {
		options.maxWidth = preferences.get('maxWidth');
	}

	// it’s a view
	if (bp && 'nodeType' in bp) {
		bp = view.breakpointForView(bp);
	}

	if (bp) {
		var widths = preferences.get('breakpointWidths', {});
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
	overrideScroll.disable();
}

function injectFont() {
	var fontCSS = document.createElement('link');
	fontCSS.setAttribute('rel', 'stylesheet');
	fontCSS.setAttribute('href', 'http://fonts.googleapis.com/css?family=Lato');
	document.head.appendChild(fontCSS);
}

function savePreferences() {
	var localData = preferences.dump();
	var globalData = {};

	if ('overrideScroll' in localData) {
		globalData.overrideScroll = localData.overrideScroll;
		delete localData.overrideScroll;
	}

	var data = {};
	data[DOMAIN] = localData;
	data['global'] = globalData;
	chrome.storage.local.set(data);
}

// route events
eventRouter.setup({
	updateViews: utils.throttle(updateAllViews, 100),
	savePreferences: utils.throttle(savePreferences, 100),
	reset: reset
});

event
	.on('view:remove', function(v) {
		if (~allViews.indexOf(v)) {
			allViews.splice(allViews.indexOf(v), 1);
		}
	})
	.on('option:copyURL', function() {
		var hash = serializer.serialize({
			url: location.href,
			breakpoints: allBreakpoints
		});
		var url = 'http://re-view.emmet.io/#' + hash;
		console.log('Copied Re:View URL:', url);
		chromeUtils.sendMessage('clipboardCopy', url);
	});

// start the app
chrome.storage.local.get(['global', DOMAIN], function(data) {
	preferences.load(data[DOMAIN] || defaultPreferences, data.global);
	uiContainer = ui.currentUI();
	if (uiContainer) {
		// UI view already created, remove it
		return hideUI();
	}

	document.addEventListener('keyup', hideUI, false);

	var overrideScrollEnabled = preferences.get('overrideScroll');
	if (typeof preferences.get('overrideScroll') === 'undefined') {
		preferences.set('overrideScroll', overrideScroll.guessState());
	}

	uiContainer = ui.create({
		panel: true,
		maxWidth: {
			enabled: preferences.get('maxWidthEnabled'),
			value: preferences.get('maxWidth')
		},
		syncScroll: preferences.get('syncScroll'),
		overrideScroll: preferences.get('overrideScroll'),
		reset: true,
		copyURL: true
	});
	document.body.appendChild(uiContainer);
	breakpoints.get({loadCSS: loadCSS}, function(bp) {
		injectFont();
		console.log('Re:View received breakpoints', bp);
		allBreakpoints = bp;
		initMainView(bp);
	});
});