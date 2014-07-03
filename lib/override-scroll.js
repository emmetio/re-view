/**
 * Reverses vertical scroll: fixes overall page height
 * by given scroll container width and translates page vertical
 * scroll to container’s horizontal scroll
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var oldState;
	var targetContainer;
	var skipEvent = false;

	function getBg() {
		return document.body;
	}

	function maxVScroll() {
		return getBg().scrollHeight - window.innerHeight;
	}

	function maxHScroll() {
		return targetContainer.scrollWidth - targetContainer.offsetWidth;
	}

	function rememberState(elem) {
		return {
			overflow: elem.style.overflow,
			height: elem.style.height
		};
	}

	function handleScroll(evt) {
		if (skipEvent) {
			return skipEvent = false;
		}
		var pos = Math.min(Math.max(0, window.pageYOffset / maxVScroll()), 1);
		var scroll = Math.round(pos * maxHScroll());
		
		skipEvent = true;
		targetContainer.scrollLeft = scroll;
	}

	function handleContainerScroll(evt) {
		if (skipEvent) {
			return skipEvent = false;
		}

		var pos = Math.min(Math.max(0, targetContainer.scrollLeft / maxHScroll()), 1);
		var scroll = Math.round(pos * maxVScroll());

		skipEvent = true;
		window.scrollTo(0, scroll);
	}

	return {
		enable: function(container) {
			this.disable();
			var bg = getBg();
			oldState = rememberState(bg);
			targetContainer = container;
			bg.style.height = container.scrollWidth + 'px';

			window.addEventListener('scroll', handleScroll, false);
			container.addEventListener('scroll', handleContainerScroll, false);
			window.scrollTo(0, 0);
		},

		disable: function() {
			window.removeEventListener('scroll', handleScroll, false);
			if (targetContainer) {
				targetContainer.removeEventListener('scroll', handleContainerScroll, false);
				targetContainer = null;
			}

			if (oldState) {
				var bg = getBg();
				bg.style.height = oldState.height || '';
				oldState = null;
			}
		},

		/**
		 * Guess if vertical scroll override should be enabled by
		 * default for current platform
		 */
		guessState: function() {
			return !/Mac/.test(navigator.userAgent);
		}
	};
});