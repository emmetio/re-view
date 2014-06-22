/**
 * Sample application for testing
 */
define(function(require, exports, module) {
	var breakpoints = require('./breakpoint');
	var view = require('./view');
	var ui = require('./ui');
	var event = require('./event');
	var preferences = require('./preferences');
	var utils = require('./utils');
	var syncScroll = require('./sync-scroll');
	var eventRouter = require('./event-router');

	var allBreakpoints = null;
	var allViews = null;
	var defaultPreferences = {
		maxWidthEnabled: true,
		maxWidth: 700,
		syncScroll: true
	};

	preferences.load(localStorage.getItem('emr') || defaultPreferences);

	var uiContainer = ui.create({
		panel: true,
		maxWidth: {
			enabled: preferences.get('maxWidthEnabled'),
			value: preferences.get('maxWidth')
		},
		syncScroll: preferences.get('syncScroll'),
		reset: true
	});

	function initMainView(bp) {
		var skipped = preferences.get('skipBreakpoints', []);
		bp = bp.filter(function(b) {
			return !~skipped.indexOf(b.id);
		});

		allViews = view.init('/example/', bp, uiContainer, viewOptions());

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

	// route events
	eventRouter.setup({
		updateViews: utils.throttle(updateAllViews, 100),
		savePreferences: utils.throttle(function() {
			localStorage.setItem('emr', preferences.dump(true));
		}, 100),
		reset: reset
	});

	event.on('view:remove', function(v) {
		if (~allViews.indexOf(v)) {
			allViews.splice(allViews.indexOf(v), 1);
		}
	});

	// start the app
	document.body.appendChild(uiContainer);
	breakpoints.get(function(bp) {
		console.log('Emmet Re:View received breakpoints', bp);
		allBreakpoints = bp;
		initMainView(bp);
	});
});