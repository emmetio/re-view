if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('./utils');
	var drag = require('./drag');
	var event = require('./event');

	var breakpointLookup = {};
	var dragData = null;
	var featureAliases = {
		minWidth: 'min',
		maxWidth: 'max'
	};

	var constrains = {
		minWidth: 200,
		maxWidth: 2000
	};

	var dragDelegate = {
		onStart: function(data) {
			var view = findView(data.elem);
			var viewOptions = {};
			var maxWidth = +(view.getAttribute('data-max-width') || 0);
			if (maxWidth) {
				viewOptions.maxWidth = maxWidth;
			}

			view.classList.add('emmet-re-view__item_drag');
			dragData = {
				view: view,
				breakpoint: breakpointLookup[view.id],
				startWidth: +view.getAttribute('data-width'),
				viewOptions: viewOptions
			};

			utils.closest(view, 'emmet-re-view')
				.classList.add('emmet-re-view_drag');
		},
		onMove: function(x, y, dx, dy) {
			var options = dragData.viewOptions;
			options.width = dragData.startWidth + dx;
			updateView(dragData.view, options);
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

	function breakpointForView(view) {
		return breakpointLookup[view.id];
	}

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
			event.trigger('view:remove', view);
		}
	}

	function restoreViewSize(evt) {
		var view = findView(evt.target);
		var bp = breakpointLookup[view.id];
		updateView(view);
	}

	/**
	 * Find parent viev for given node
	 * @param  {Element} elem
	 * @return {Element}
	 */
	function findView(elem) {
		return utils.closest(elem, 'emmet-re-view__item');
	}

	function updateView(view, options) {
		options = options || {};
		var width = options.width || 0;
		var maxWidth = options.maxWidth || 0;
		if (!width) {
			width = breakpointForView(view).smallest;
		}

		width = Math.max(Math.min(constrains.maxWidth, width), constrains.minWidth);


		// check if we should update view
		if (width === +view.getAttribute('data-width') && maxWidth === +view.getAttribute('data-max-width')) {
			return;
		}

		var originalWidth = width;
		var ratio = '100%', revRatio = 1;

		if (maxWidth && width > maxWidth) {
			// limit view size and scale iframe
			ratio = (width / maxWidth * 100) + '%';
			revRatio = maxWidth / width;
			width = maxWidth;
			// originalWidth = Math.round(width * (width / options.maxWidth));
		}

		view.style.width = width + 'px';
		view.setAttribute('data-width', originalWidth);
		view.setAttribute('data-max-width', maxWidth);
		var iframe = view.querySelector('iframe');
		iframe.style.cssText += ';width:' + ratio + ';height:' + ratio + ';'
			+ '-webkit-transform:scale(' + revRatio + ');'
			+ '-moz-transform:scale(' + revRatio + ');'
			+ 'transform:scale(' + revRatio + ');';
		event.trigger('view:update', view);
		return view;
	}

	function createViewUI(view, bp) {
		var ui = utils.el('div', 'emmet-re-view__item-ui');
		ui.innerHTML = 
			'<div class="emmet-re-view__item-ui-top">\
				<i class="emmet-re-view__icon" data-icon="cross" data-action="close-view" title="Close view"></i>\
			</div>\
			<div class="emmet-re-view__item-ui-resize"></div>';

		var label = utils.el('div', 'emmet-re-view__item-ui-label');
		var labelContent = bp.features.map(function(feat) {
			return (featureAliases[feat] || feat) + ': ' + bp[feat];
		});
		label.innerHTML = labelContent.join(', ');

		view.appendChild(ui);
		view.appendChild(utils.el('div', 'emmet-re-view__item-ui-resize-overlay'));
		view.appendChild(label);
		addEvents(view);
		return view;
	}

	return {
		/**
		 * Creates views in container for given breakpoints
		 * @param  {String}  url         Page URL
		 * @param  {Array}   breakpoints List of breakpoints
		 * @param  {Element} container   Container where views should appear
		 * @param  {Object}  options     Additional options for view factory
		 * @return {Array}               Array of created views
		 */
		init: function(url, breakpoints, container, options) {
			if (typeof container === 'string') {
				container = document.querySelector(container);
			}

			var allViews = [];
			var fragment = document.createDocumentFragment();
			breakpoints.forEach(function(b) {
				var view = this.create(url, b, options);
				allViews.push(view);
				fragment.appendChild(view);
			}, this);

			container.appendChild(fragment);
			return allViews;
		},
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
			event.trigger('view:create', view)
			return this.update(view, options);
		},

		/**
		 * Updates given view dimensions
		 * @param  {Element} view    
		 * @param  {Object} options
		 * @return {Element}
		 */
		update: updateView,

		/**
		 * Removes given view
		 */
		remove: removeView,

		setDefaults: function(value) {
			viewOptions = value;
		},

		/**
		 * Returns breakpoint used to generate given view
		 * @param  {Element} view
		 * @return {String}
		 */
		breakpointForView: breakpointForView
	};
});