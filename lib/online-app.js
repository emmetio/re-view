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

	var state = location.hash;
	var allViews = null;
	var defaultPreferences = {
		maxWidthEnabled: true,
		maxWidth: 700
	};

	preferences.load(defaultPreferences);
	var appData = serializer.unserialize(state);

	if (!appData) {
		console.log('no app data');
		return;
	}

	var uiContainer = ui.create({
		panel: true,
		maxWidth: {
			enabled: preferences.get('maxWidthEnabled'),
			value: preferences.get('maxWidth')
		},
		syncScroll: 'disabled',
		reset: true
	});

	function initMainView(bp) {
		allViews = view.init(appData.url, bp, uiContainer, viewOptions());
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
	var mainContent = document.querySelector('.main-content');
	if (mainContent) {
		mainContent.parentNode.removeChild(mainContent);
	}
	document.body.appendChild(uiContainer);
	initMainView(appData.breakpoints);
});