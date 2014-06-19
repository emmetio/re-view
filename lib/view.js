if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var breakpoint = require('./breakpoint');
	var utils = require('./utils');

	return {
		/**
		 * Creates view for given breakpoint
		 * @param  {String} url     URL of view
		 * @param  {Object} bp      Designated breakpoint description
		 * @param  {Object} options Additional options
		 * @return {Element}
		 */
		create: function(url, bp, options) {
			var view = utils.el('div', 'emmet-re-view__item');
			var iframe = utils.el('iframe', 'emmet-re-view-iframe', {
				src: url
			});

			view.appendChild(iframe);
			return this.update(view, bp, options);
		},

		/**
		 * Updates given view dimensions
		 * @param  {Element} view    
		 * @param  {Object} bp      
		 * @param  {Object} options
		 * @return {Element}
		 */
		update: function(view, bp, options) {
			options = options || {};
			var iframe = view.querySelector('iframe');
			var width = breakpoint.smallestConstrain(bp.real);

			if (options.maxWidth && width > options.maxWidth) {
				// limit view size and scale iframe
				var ratio = (width / options.maxWidth * 100) + '%';
				var revRatio = options.maxWidth / width;
				iframe.style.cssText += ';width:' + ratio + ';height:' + ratio + ';'
					+ '-webkit-transform:scale(' + revRatio + ');'
					+ 'transform:scale(' + revRatio + ');';
				width = options.maxWidth;
			}

			view.style.width = width + 'px';
			return view;
		}
	}
});