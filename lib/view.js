if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('./utils');
	var drag = require('./drag');

	var breakpointLookup = {};
	var dragData = null;
	var featureAliases = {
		minWidth: 'min',
		maxWidth: 'max'
	};

	var defaultViewOptions = {
		minWidth: 200,
		maxWidth: 700
	};

	var dragDelegate = {
		onStart: function(data) {
			var view = findView(data.elem);
			view.classList.add('emmet-re-view__item_drag');
			dragData = {
				view: view,
				breakpoint: breakpointLookup[view.id],
				startWidth: view.offsetWidth,
				minWidth: 200,
				maxWidth: 10000
			};

			utils.closest(view, 'emmet-re-view')
				.classList.add('emmet-re-view_drag');;
		},
		onMove: function(x, y, dx, dy) {
			var width = Math.min(Math.max(dragData.minWidth, dragData.startWidth + dx), dragData.maxWidth);
			updateView(dragData.view, dragData.breakpoint, {
				width: width,
				maxWidth: width
			});

			return false;
		},
		onEnd: function() {
			if (dragData && dragData.view) {
				utils.closest(dragData.view, 'emmet-re-view')
					.classList.remove('emmet-re-view_drag');;
			}
			dragData = null;
		}
	};

	function addEvents(view) {
		var resizeHandler = view.querySelector('.emmet-re-view__item-ui-resize');
		drag.makeDraggable(resizeHandler, dragDelegate);
		resizeHandler.addEventListener('dblclick', restoreViewSize, false);
		view.addEventListener('click', function(evt) {
			var trigger = utils.findActionTrigger(evt.target);
			if (trigger && trigger.action === 'close-view') {
				removeView(evt.target);
			}
		});
	}

	function removeView(elem) {
		var view = findView(elem);
		if (view && view.parentNode) {
			view.parentNode.removeChild(view);
		}
	}

	function restoreViewSize(evt) {
		var view = findView(evt.target);
		var bp = breakpointLookup[view.id];
		updateView(view, bp);
	}

	/**
	 * Find parent viev for given node
	 * @param  {Element} elem
	 * @return {Element}
	 */
	function findView(elem) {
		return utils.closest(elem, 'emmet-re-view__item');
	}

	function updateView(view, bp, options) {
		options = options || defaultViewOptions;
		var iframe = view.querySelector('iframe');
		var width = options.width || bp.smallest;

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

	function createViewUI(view, bp) {
		var ui = utils.el('div', 'emmet-re-view__item-ui');
		ui.innerHTML = 
			'<div class="emmet-re-view__item-ui-top">\
				<i class="emmet-re-view__icon" data-icon="cross" data-action="close-view" title="Close view"></i>\
			</div>\
			<div class="emmet-re-view__item-ui-resize-overlay"></div>\
			<div class="emmet-re-view__item-ui-resize"></div>';

		var label = utils.el('div', 'emmet-re-view__item-ui-label');
		var labelContent = bp.features.map(function(feat) {
			return (featureAliases[feat] || feat) + ': ' + bp[feat];
		});
		label.innerHTML = labelContent.join(', ');

		view.appendChild(ui);
		view.appendChild(label);
		addEvents(view);
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
			var viewId = 'view_' + bp.id;
			breakpointLookup[viewId] = bp;
			var view = utils.el('div', 'emmet-re-view__item', {
				id: viewId
			});
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
		update: updateView
	};
});