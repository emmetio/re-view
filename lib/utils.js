if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	return {
		/**
		 * Creates new DOM element with given name, class name 
		 * and attributes
		 * @param  {String} name      Element name
		 * @param  {String} className Class name
		 * @param  {Object} attrs     Hash with attributes to add to element
		 * @return {Element}
		 */
		el: function(name, className, attrs) {
			if (typeof className === 'object') {
				attrs = className;
				className = null;
			}

			var elem = document.createElement(name);
			if (className) {
				elem.className = className;
			}

			if (attrs) {
				Object.keys(attrs).forEach(function(name) {
					elem.setAttribute(name, attrs[name]);
				});
			}

			return elem;
		}
	};
});