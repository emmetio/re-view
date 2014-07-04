/**
 * Creates UI container for breakpoint views
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var event = require('./event');
	var utils = require('./utils');
	var preferences = require('./preferences');
	var containerClass = 'emmet-re-view';

	var defaultFeatures = {
		panel: true,
		syncScroll: true,
		overrideScroll: true,
		maxWidth: {
			enabled: true,
			min: 200,
			max: 2000,
			value: 700
		},
		copyURL: true,
		reset: true
	};

	var featureFactory = {
		syncScroll: function(state) {
			if (state === 'disabled') {
				return panelOption(
					'<span class="emmet-re-view__panel-option-comment">Sync scrolling is not available due to browser security restrictions :-(</span>'
				);
			}

			var ui = panelOption(
				'<input type="checkbox" name="sync-scroll" id="emr-sync-scroll" class="emmet-re-view__checkbox" />\
				<i class="emmet-re-view__icon" data-icon="checkbox"></i>\
				<label class="emmet-re-view__label" for="emr-sync-scroll">Sync scrolling</label>'
			);

			var checkbox = ui.querySelector('input[type="checkbox"]');
			checkbox.checked = !!state;
			checkbox.addEventListener('change', function(evt) {
				event.trigger('option:syncScroll', checkbox.checked);
			}, false);

			event.on('preference:load', function(name, value) {
				checkbox.checked = !!preferences.get('syncScroll');
			});
			return ui;
		},
		overrideScroll: function(state) {
			var ui = panelOption(
				'<input type="checkbox" name="override-scroll" id="emr-override-scroll" class="emmet-re-view__checkbox" />\
				<i class="emmet-re-view__icon" data-icon="checkbox"></i>\
				<label class="emmet-re-view__label" for="emr-override-scroll">Override vertical scroll</label>'
			);

			var checkbox = ui.querySelector('input[type="checkbox"]');
			checkbox.checked = !!state;
			checkbox.addEventListener('change', function(evt) {
				event.trigger('option:overrideScroll', checkbox.checked);
			}, false);

			event.on('preference:load', function(name, value) {
				checkbox.checked = !!preferences.get('overrideScroll');
			});
			return ui;
		},
		maxWidth: function(params) {
			params = utils.defaults(params, defaultFeatures.maxWidth);
			var ui = panelOption(
				'<input type="checkbox" name="max-width-enabled" id="emr-max-width-enabled" />\
				<i class="emmet-re-view__icon" data-icon="checkbox"></i>\
				<label class="emmet-re-view__label" for="emr-max-width-enabled">Max Viewport Width</label>\
				<input type="number" name="max-width" id="emr-max-width" value="" min="200" max="2000" size="4" maxlength="4" class="emmet-re-view__input" />'
			);

			var checkbox = ui.querySelector('input[name="max-width-enabled"]');
			var input = ui.querySelector('input[name="max-width"]');
			var validate = function(val) {
				val = +(val || input.value);
				if (isNaN(val)) {
					val = defaultFeatures.maxWidth;
				}

				var min = +input.getAttribute('min');
				var max = +input.getAttribute('max');

				return Math.min(Math.max(min, val), max);
			};

			checkbox.checked = !!params.enabled;
			checkbox.addEventListener('change', function(evt) {
				event.trigger('option:maxWidthEnabled', checkbox.checked);
			}, false);

			input.addEventListener('input', function(evt) {
				event.trigger('option:maxWidth', validate());
			});

			input.addEventListener('blur', function(evt) {
				input.value = validate();
			});

			input.min = params.min;
			input.max = params.max;
			input.value = validate(params.value);

			event.on('preference:load', function(name, value) {
				input.value = validate(preferences.get('maxWidth'));
				checkbox.checked = !!preferences.get('maxWidthEnabled');
			});

			return ui;
		},

		copyURL: function(handler) {
			var ui = panelOption('<button class="emmet-re-view__button" data-action="copy-url">Copy URL</button>');
			var button = ui.querySelector('button');
			button.addEventListener('click', function(evt) {
				if (typeof handler === 'function') {
					handler();
				}
				event.trigger('option:copyURL');
			}, false);
			return ui;
		},

		reset: function(handler) {
			var ui = panelOption('<button class="emmet-re-view__button" data-action="reset">Reset</button>');
			var button = ui.querySelector('button');
			button.addEventListener('click', function(evt) {
				if (typeof handler === 'function') {
					handler();
				}
				event.trigger('option:reset');
			}, false);
			return ui;
		}
	};

	function panelOption(innerHTML) {
		var elem = utils.el('div', 'emmet-re-view__panel-option');
		if (innerHTML) {
			elem.innerHTML = innerHTML;
		}
		return elem;
	}

	return {
		/**
		 * Creates UI container with given features
		 * @param  {Object} features Hash of features to add to UI
		 * @return {Element}         
		 */
		create: function(features) {
			features = features || defaultFeatures;
			var root = utils.el('div', containerClass);

			var err = utils.el('p', 'emmet-re-view__error');
			err.innerHTML = 'Re:View was unable to find responsive breakpoints on current page. Make sure it contains media queries with <code>min-width</code> or <code>max-width</code> expressions and try again.';
			root.appendChild(err);

			root.appendChild(utils.el('div', 'emmet-re-view__scroller'));
			if (features.panel) {
				var panel = utils.el('div', 'emmet-re-view__panel');
				var leftSection = utils.el('div', 'emmet-re-view__panel-section');
				var rightSection = utils.el('div', 'emmet-re-view__panel-section');

				['maxWidth', 'syncScroll', 'overrideScroll'].forEach(function(feat) {
					if (feat in features) {
						leftSection.appendChild(featureFactory[feat](features[feat]));
					}
				});

				['reset', 'copyURL'].forEach(function(feat) {
					if (feat in features) {
						rightSection.appendChild(featureFactory[feat](features[feat]));
					}
				});

				panel.appendChild(leftSection);
				panel.appendChild(rightSection);
				root.appendChild(panel);
			}

			return root;
		},

		/**
		 * Returns current UI container on page, if there is one
		 * @return {Element}
		 */
		currentUI: function() {
			return document.querySelector('.' + containerClass);
		},

		scroller: function(container) {
			container = container || this.currentUI();
			return container.querySelector('.emmet-re-view__scroller');
		},

		panel: function(container) {
			container = container || this.currentUI();
			return container.querySelector('.emmet-re-view__panel');
		},

		/**
		 * Removes UI container from page
		 * @param  {Element} container UI container to remove. If absent,
		 * tries to find one on page
		 */
		remove: function(container) {
			container = container || this.currentUI();
			if (container && container.parentNode) {
				container.parentNode.removeChild(container);
			}
		}
	};
});