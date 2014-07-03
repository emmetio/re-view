/**
 * Module for storing and updating preferences for breakpoint view
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var event = require('./event');
	var utils = require('./utils');
	
	/**
	 * Preferences for curren session
	 * @type {Object}
	 */
	var preferences = {};
	
	return {
		/**
		 * Loads preferences for current session
		 * @param  {Object} data
		 */
		load: function(data) {
			preferences = {};
			for (var i = 0, il = arguments.length, data; i < il; i++) {
				data = arguments[i];
				if (!data) {
					continue;
				}

				if (typeof data === 'string') {
					data = JSON.parse(data);
				}

				preferences = utils.extend(preferences, data);
			}
			
			event.trigger('preference:load');
		},

		/**
		 * Returns current session preferences
		 * @return {Object}
		 */
		dump: function(asString) {
			return asString ? JSON.stringify(preferences) : preferences;
		},

		/**
		 * Returns preferences value for given key
		 * @param  {String} key Preference key
		 * @param  {Object} defaultValue Optional defaul value to return
		 * if preference wasn’t found in storage
		 * @return {Object}
		 */
		get: function(key, defaultValue) {
			if (key in preferences) {
				var out = preferences[key];
				if (Array.isArray(out)) {
					return out.slice(0);
				}

				if (typeof out === 'object') {
					return utils.extend({}, out);
				}

				return out;
			}

			return defaultValue;
		},

		/**
		 * Updates given preference value
		 * @param {String} key   
		 * @param {Object} value
		 */
		set: function(key, value) {
			var oldValue = preferences[key];
			if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
				preferences[key] = value;
				event.trigger('preference:change', key, value, oldValue);
			}
		},

		/**
		 * Resets preferences storage to initial state
		 */
		reset: function() {
			preferences = {};
			event.trigger('preference:reset');
		}
	};
});