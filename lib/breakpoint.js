if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('./utils');

	var allowedFeatures = ['min-width', 'max-width'];
	var reFeature = /\(\s*([\w\-]+)\s*:\s*(.+?)\)/g;

	function Breakpoint(features) {
		this._real = null;
		this._id = null;
		this._features = null;
		this.features = features;
	}

	Breakpoint.prototype = {
		/**
		 * Returns real size (in pixels) of given feature
		 * @param  {String} feature
		 */
		real: function(feature) {
			if (!this._real) {
				this.measure();
			}

			return this._real[normalizeName(feature)];
		},

		/**
		 * Measures real feature's dimentions
		 * @param  {Element} ctx Optional content element where 
		 * features should be measured
		 * @return {Object}     Real feature sizes
		 */
		measure: function(ctx) {
			ctx = ctx || document.body;
			
			var real = {};
			var self = this;
			var m = utils.el('div');
			m.style.cssText = 'position:absolute;padding:0;margin:0;top:0;left:0;height:0;';
			ctx.appendChild(m);

			this.features.forEach(function(feat) {
				m.style.width = self[feat];
				real[feat] = m.offsetWidth;
			});

			ctx.removeChild(m);
			return this._real = real;
		}
	};

	Object.defineProperties(Breakpoint.prototype, {
		'id': {
			get: function() {
				if (this._id === null) {
					if (!this.features.length) {
						return null;
					}

					var self = this;
					this._id = 'bp_' + this.features.map(function(f) {
						return f + self[f];
					}).join('__');
				}

				return this._id;
			}
		},

		'features': {
			get: function() {
				if (!this._features) {
					var out = [];
					Object.keys(this).forEach(function(key) {
						if (key.charAt(0) !== '_') {
							out.push(key);
						}
					});

					this._features = out.sort();
				}

				return this._features;
			},
			set: function(value) {
				var self = this;
				this._id = this._features = this._real = null;
				Object.keys(value || {}).forEach(function(feature) {
					self[normalizeName(feature)] = value[feature];
				});
			}
		},
		/**
		 * Returns smallest feature size for current breakpoint
		 * @type {Number}
		 */
		'smallest': {
			get: function(breakpoint) {
				var smallest = Number.POSITIVE_INFINITY;
				var self = this;
				this.features.forEach(function(feat) {
					smallest = Math.min(smallest, self.real(feat));
				});

				return smallest !== Number.POSITIVE_INFINITY ? smallest : 0;
			}
		}
	});

	function normalizeName(str) {
		return str.replace(/\-([a-z])/g, function(str, ch) {
			return ch.toUpperCase();
		});
	}

	function emptyFilter(b) {
		return !!b;
	};

	/**
	 * Parses media query expression and returns breakpoint
	 * options
	 * @param  {String} mq Media Query expression
	 * @return {Breakpoint}
	 */
	function parse(mq) {
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

		return empty ? null : new Breakpoint(out);
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
		utils.sendMessage('loadCSS', {url: url}, function(response) {
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

	function readCSSOM(stylesheet, breakpoints) {
		breakpoints = breakpoints || [];
		var rules = stylesheet.cssRules || [];

		for (var i = 0, il = rules.length; i < il; i++) {
			if (rules[i].media) {
				for (var j = 0, jl = rules[i].media.length; j < jl; j++) {
					breakpoints.push(parse(rules[i].media[j]));
				}
			}
			
			if (rules[i].styleSheet) {
				readCSSOM(rules[i].styleSheet, breakpoints);
			}
		}

		return breakpoints;
	}

	return {
		/**
		 * Returns parsed and sorted breakpoints found on current page
		 * @return {Array}
		 */
		get: function(callback) {
			this.find(function(breakpoints) {
				callback(breakpoints.sort(function(a, b) {
					return a.smallest - b.smallest;
				}));
			});
		},

		/**
		 * Filters given breakpoints list and leaves unique items only
		 * @param  {Array} breakpoints
		 * @return {Array}
		 */
		unique: function(breakpoints) {
			var lookup = {};
			return breakpoints.filter(function(b) {
				if (!lookup[b.id]) {
					return lookup[b.id] = true;
				}
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

			callback(readCSSOM(stylesheet).filter(emptyFilter));
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
			var self = this;

			var next = function(bp) {
				parsed++;
				breakpoints = breakpoints.concat(bp);
				if (parsed >= total) {
					callback(self.unique(breakpoints));
				}
			};

			for (var i = 0, il = list.length; i < il; i++) {
				this.findInStylesheet(list[i], next);
			}
		}
	};
});