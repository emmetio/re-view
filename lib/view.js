if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('./utils');

	function createViewUI(view, bp) {
		var ui = utils.el('div', 'emmet-re-view__item-ui');
		ui.innerHTML = 
			'<div class="emmet-re-view__item-ui-top">\
				<i class="emmet-re-view__icon" data-icon="cross" data-action="close-view" title="Close view"></i>\
			</div>\
			<div class="emmet-re-view__item-ui-resize"></div>';

		var label = utils.el('div', 'emmet-re-view__item-ui-label');
		var labelContent = [];
		label.innerHTML = labelContent.join(', ');

		view.appendChild(ui);
		view.appendChild(label);
		return view;
	}

	return {
		/**
		 * Creates view for given breakpoint
		 * @param  {String} url     URL of view
		 * @param  {Breakpoint} bp      Designated breakpoint description
		 * @param  {Object} options Additional options
		 * @return {Element}
		 */
		create: function(url, bp, options) {
			var view = utils.el('div', 'emmet-re-view__item');
			var iframe = utils.el('iframe', 'emmet-re-view-iframe', {
				src: url
			});

			createViewUI(view, bp);
			view.appendChild(iframe);
			return this.update(view, bp, options);
		},

		/**
		 * Updates given view dimensions
		 * @param  {Element} view    
		 * @param  {Breakpoint} bp      
		 * @param  {Object} options
		 * @return {Element}
		 */
		update: function(view, bp, options) {
			options = options || {};
			var iframe = view.querySelector('iframe');
			var width = bp.smallest;

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
	};
});