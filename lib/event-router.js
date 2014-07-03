/**
 * Default event router
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var event = require('./event');
	var preferences = require('./preferences');
	var syncScroll = require('./sync-scroll');
	var overrideScroll = require('./override-scroll');
	var view = require('./view');
	var ui = require('./ui');

	function parseEvent(evt) {
		var parts = evt.split(':');
		return {
			ns: parts.length > 1 ? parts.shift() : null,
			name: parts[0]
		};
	}

	function execDelegate(delegate, method) {
		if (delegate && typeof delegate[method] === 'function') {
			delegate[method]();
		}
	}

	return {
		setup: function(delegate) {
			event.on('all', function(name, value) {
				var evt = parseEvent(name);
				if (evt.ns === 'option') {
					// route UI options change events to preferences module
					switch (evt.name) {
						case 'maxWidthEnabled':
							preferences.set(evt.name, value);
							execDelegate(delegate, 'updateViews');
							break;
						case 'maxWidth':
							preferences.set(evt.name, value);
							execDelegate(delegate, 'updateViews');
							break;
						case 'reset':
							execDelegate(delegate, 'reset');
							break;
						case 'syncScroll':
							preferences.set(evt.name, value);
							syncScroll.enabled = !!value;
							break;
						case 'overrideScroll':
							preferences.set(evt.name, value);
							if (!!value) {
								overrideScroll.enable(ui.scroller());
							} else {
								overrideScroll.disable();
							}
							break;
					}
				} else if (evt.ns === 'view') {
					var bp = view.breakpointForView(value);
					if (!bp) {
						return;
					}

					switch (evt.name) {
						case 'remove':
							var skipped = preferences.get('skipBreakpoints', []);
							if (!~skipped.indexOf(bp.id)) {
								// mark breakpoint as skipped so it won’t appear
								// on next reload
								skipped.push(bp.id);
								preferences.set('skipBreakpoints', skipped);
							}
							break;
						case 'update':
							var widths = preferences.get('breakpointWidths', {});
							var viewWidth = +value.getAttribute('data-width');
							if (viewWidth && !isNaN(viewWidth)) {
								widths[bp.id] = viewWidth;
								preferences.set('breakpointWidths', widths);
							}
							break;
					}
				} else if (evt.ns === 'preference') {
					switch (evt.name) {
						case 'change':
							execDelegate(delegate, 'savePreferences');
							break;
						case 'load':
							syncScroll.enabled = preferences.get('syncScroll');
							break;
					}
				}
			});
		}
	};
});