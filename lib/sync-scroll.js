if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('./utils');
	var event = require('./event');
	var scrollViews = [];
	var locked = false;

	function getScrollData(wnd) {
		return {
			totalHeight: wnd.document.documentElement.scrollHeight,
			viewportHeight: wnd.innerHeight,
			scrollX: wnd.scrollX,
			scrollY: wnd.scrollY
		};
	}

	function getScrollPosition(wnd) {
		var data = getScrollData(wnd);
		return data.scrollY / (data.totalHeight - data.viewportHeight);
	}

	function iframe(view) {
		return view.querySelector('iframe');
	}

	/**
	 * Syncronizes all veiws scroll positions from given one
	 * @param  {Element} fromView Origin view
	 */
	function sync(fromView) {
		locked = true;
		var pos = getScrollPosition(iframe(fromView).contentWindow);
		scrollViews.forEach(function(view) {
			if (view === fromView) {
				return;
			}

			var wnd = iframe(view).contentWindow;
			var data = getScrollData(wnd);
			var localPos = Math.round((data.totalHeight - data.viewportHeight) * pos);
			wnd.scrollTo(data.scrollX, localPos);
		});
		setTimeout(unlock, 10);
	}

	function unlock() {
		locked = false;
	}

	var throttledSync = utils.throttle(sync, 50);

	event.on('view:remove', function(view) {
		var ix = scrollViews.indexOf(view);
		if (~ix) {
			scrollViews.splice(ix, 1);
		}
	});

	return {
		enabled: true,
		init: function(view) {
			if (~scrollViews.indexOf(view)) {
				return;
			}

			scrollViews.push(view);

			var self = this;
			var vp = iframe(view);

			if (vp.contentWindow) {
				vp.contentWindow.addEventListener('scroll', function(evt) {
					if (!self.enabled) {
						return;
					}

					if (!locked) {
						throttledSync(view);
					}
				});
			}
		},

		sync: sync,
		reset: function() {
			scrollViews.length = 0;
		}
	};
});