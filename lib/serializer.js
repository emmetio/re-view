/**
 * Serializes current Re:View state into a string.
 * This string can be passed in URL to online Re:View to restore saved state
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var preferences = require('./preferences');
	var breakpoint = require('./breakpoint');

	return {
		serialize: function(data) {
			var out = [];

			var views = [];
			var breakpointWidth = preferences.get('breakpointWidth', {});
			var skipped = preferences.get('skipBreakpoints', []);
			data.breakpoints.forEach(function(bp) {
				if (~skipped.indexOf(bp.id)) {
					return;
				}
				views.push(breakpointWidth[bp.id] || bp.smallest);
			});

			out.push('b' + views.join(','));

			if (preferences.get('maxWidthEnabled')) {
				out.push('w' + preferences.get('maxWidth'));
			}

			out.push(encodeURIComponent(data.url));
			return out.join('|');
		},
		unserialize: function(hash) {
			hash = (hash || '').trim();
			if (hash[0] === '#') {
				hash = hash.substr(1);
			}

			if (!hash) {
				return null;
			}

			var minWidth = null;
			var bp = [];

			var parts = hash.split('|');
			// the last part should be URL
			var url = decodeURIComponent(parts.pop());

			parts.forEach(function(part) {
				switch (part[0]) {
					case 'b':
						bp = part.substr(1).split(',')
							.map(function(width) {
								width = +width;
								return !isNaN(width) ? breakpoint.create(width) : null;
							})
							.filter(function(width) {
								return !!width;
							});
						break;
					case 'w':
						part = +part.substr(1);
						if (!isNaN(part)) {
							minWidth = part;
						}
						break;
				}
			});

			// validate input
			if (!url || !bp || !bp.length) {
				return null;
			}

			if (minWidth) {
				preferences.set('minWidthEnabled', true);
				preferences.set('minWidth', minWidth);
			} else {
				preferences.set('minWidthEnabled', false);
			}

			return {
				url: url,
				breakpoints: bp
			};
		}
	};
});