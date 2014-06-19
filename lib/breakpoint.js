if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('./utils');

	var allowedFeatures = ['min-width', 'max-width'];
	var reFeature = /\(\s*([\w\-]+)\s*:\s*(.+?)\)/g;

	function emptyFilter(b) {
		return !!b;
	};

	/**
	 * Parses media query expression and returns breakpoint
	 * options
	 * @param  {String} mq Media Query expression
	 * @return {Object}
	 */
	function parse(mq) {
		mq = mq.trim();
		if (!/^\s*screen\s*/.test(mq)) {
			// allow breakpoints for "screen" medium only
			return null;
		}

		var feature, out = {}, empty = true;
		mq.replace(reFeature, function(str, feature, value) {
			feature = feature.trim();
			if (~allowedFeatures.indexOf(feature)) {
				empty = false;
				out[feature] = value.trim();
			}
			return '';
		});

		return empty ? null : out;
	}

	function walkCSS(node, out) {
		out = out || [];
		if (node && node.rules) {
			node.rules.forEach(function(rule) {
				if (rule.type === 'media') {
					out.push(parse(rule.name));
				}
				walkCSS(rule, out);
			});
		}

		return out;
	}

	function loadCSS(url, callback) {
		chrome.runtime.sendMessage({
			action: 'loadCSS',
			data: {url: url}
		}, function(response) {
			if (response.err) {
				console.log(response.err);
				return callback([]);
			}

			var ast = response.ast;
			if (typeof ast === 'string') {
				ast = JSON.parse(ast);
			}
			return callback(walkCSS(ast.stylesheet).filter(emptyFilter));
		});
	}

	/**
	 * Filters given breakpoints list and leaves unique items only
	 * @param  {Array} breakpoints
	 * @return {Array}
	 */
	function unique(breakpoints) {
		var lookup = {};
		return breakpoints.filter(function(b) {
			var key = Object.keys(b).sort().map(function(k) {
				return k + ':' + b[k];
			});

			if (!lookup[key]) {
				return lookup[key] = true;
			}
		});
	}

	return {
		/**
		 * Returns parsed and sorted breakpoints found on current page
		 * @return {Array}
		 */
		get: function(callback) {
			var self = this;
			this.find(function(breakpoints) {
				callback(self.sorted(breakpoints));
			});
		},

		/**
		 * Finds breakpoints in given stylesheet
		 * @param  {CSSStyleSheet} stylesheet
		 * @return {Array}
		 */
		findInStylesheet: function(stylesheet, callback) {
			if (!stylesheet.cssRules) {
				// css rules are not available: seems like stylesheet
				// was loaded from another origin.
				// In this case, load & parse CSS manually
				return loadCSS(stylesheet.href, callback);
			}

			var breakpoints = [];
			console.log('saerching', stylesheet);
			var rules = stylesheet.cssRules || [];

			for (var i = 0, il = rules.length; i < il; i++) {
				if (rules[i].media) {
					for (var j = 0, jl = rules[i].media.length; j < jl; j++) {
						breakpoints.push(parse(rules[i].media[j]));
					}
				}
			}

			callback(breakpoints.filter(emptyFilter));
		},

		/**
		 * Finds all breakpoints in current document or given
		 * stylesheet list
		 * @return {Array}
		 */
		find: function(callback) {
			var list = document.styleSheets;
			var breakpoints = [];

			var total = list.length, parsed = 0;

			var next = function(bp) {
				parsed++;
				breakpoints = breakpoints.concat(bp);
				if (parsed >= total) {
					callback(unique(breakpoints));
				}
			};

			for (var i = 0, il = list.length; i < il; i++) {
				this.findInStylesheet(list[i], next);
			}
		},

		/**
		 * Returns sorted list of breakpoints. Breakpoints are sorted by real
		 * size, from smallets to largest
		 * @param  {Array} breakpoints List of parsed breakpoints
		 * @return {Array}             New list containing original and resolved
		 * breakpoints
		 */
		sorted: function(breakpoints, ctx) {
			var self = this;
			return this.measure(breakpoints, ctx).map(function(size, i) {
				return {
					real: size,
					original: breakpoints[i]
				};
			}).sort(function(a, b) {
				return self.smallestConstrain(a.real) - self.smallestConstrain(b.real);
			});
		},

		/**
		 * Measures given breakpoints constrains in pixels
		 * @param  {Array} breakpoints List of parsed breakpoints
		 * @return {Array}             New list with breakpoint measures
		 */
		measure: function(breakpoints, ctx) {
			ctx = ctx || document.body;
			var m = utils.el('div');
			m.style.cssText = 'position:absolute;padding:0;margin:0;top:0;left:0;height:0;';
			ctx.appendChild(m);

			var out = breakpoints.map(function(b) {
				var measure = {};
				Object.keys(b).forEach(function(k) {
					m.style.width = b[k];
					measure[k] = m.offsetWidth;
				});
				return measure;
			});

			ctx.removeChild(m);
			return out;
		},

		/**
		 * Returns smallest constrain for given breakpoint
		 * @param  {Object} breakpoint
		 * @return {Number}
		 */
		smallestConstrain: function(breakpoint) {
			var smallest = Number.POSITIVE_INFINITY;
			Object.keys(breakpoint).forEach(function(k) {
				if (breakpoint[k] < smallest) {
					smallest = breakpoint[k];
				}
			});

			return smallest !== Number.POSITIVE_INFINITY ? smallest : 0;
		}
	};
});