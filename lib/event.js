/**
 * Global event bus
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var mixin = require('./eventMixin');
	var utils = require('./utils');
	return utils.extend({}, mixin);
});
