/**
 * Utils for Google Chrome browser
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	return {
		sendMessage: function(name, params, callback) {
			if (typeof params === 'function') {
				callback = params;
				params = null;
			}

			var payload = {
				action: name,
				data: params || {}
			};

			if (callback) {
				chrome.runtime.sendMessage(payload, callback);
			} else {
				chrome.runtime.sendMessage(payload);
			}
		}
	};
});