if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var view = require('./view');
	var ui = require('./ui');
	var event = require('./event');
	var preferences = require('./preferences');
	var utils = require('./utils');
	var eventRouter = require('./event-router');
	var serializer = require('./serializer');
	var syncScroll = require('./sync-scroll');
	var overrideScroll = require('./override-scroll');

	var state = location.hash;
	var isAppView = true;
	var allViews = null;
	var defaultPreferences = {
		maxWidthEnabled: true,
		maxWidth: 700,
		overrideScroll: overrideScroll.guessState()
	};

	preferences.load(defaultPreferences);
	var appData = serializer.unserialize(state);

	if (!appData) {
		isAppView = false;
		appData = serializer.unserialize('b320,480,760,768,860,991|w700|./example/');	}

	var uiContainer = ui.create({
		panel: isAppView,
		maxWidth: {
			enabled: preferences.get('maxWidthEnabled'),
			value: preferences.get('maxWidth')
		},
		syncScroll: isAppView ? 'disabled' : true,
		overrideScroll: preferences.get('overrideScroll'),
		reset: true
	});

	function initMainView(bp) {
		var scroller = ui.scroller(uiContainer);
		allViews = view.init(appData.url, bp, scroller, viewOptions());

		setTimeout(function() {
			if (!isAppView) {
				allViews.forEach(function(v) {
					syncScroll.init(v);
				});
			} else if (preferences.get('overrideScroll')) {
				overrideScroll.enable(scroller);
			}
		}, 100);
	}

	function reset() {
		while (allViews.length) {
			view.remove(allViews.pop());
		}
		preferences.load(defaultPreferences);
		appData = serializer.unserialize(state);
		initMainView(appData.breakpoints);
	}

	function viewOptions(v) {
		var options = {};
		if (preferences.get('maxWidthEnabled')) {
			options.maxWidth = preferences.get('maxWidth');
		}

		return options;
	}

	function updateAllViews() {
		allViews.forEach(function(v) {
			view.update(v, viewOptions(v));
		});
	}

	// route events
	eventRouter.setup({
		updateViews: utils.throttle(updateAllViews, 100),
		reset: reset
	});

	event.on('view:remove', function(v) {
		if (~allViews.indexOf(v)) {
			allViews.splice(allViews.indexOf(v), 1);
		}
	});

	// start the app
	if (isAppView) {
		var mainContent = document.querySelector('.main-content');
		if (mainContent) {
			mainContent.parentNode.removeChild(mainContent);
		}
		document.body.className += ' is-app';
		document.body.appendChild(uiContainer);
	} else {
		document.querySelector('.preview').appendChild(uiContainer);
	}

	initMainView(appData.breakpoints);
});