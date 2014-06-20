/**
 * Simple module for dragging elements on page
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var dragData = null;

	function onMouseMove(evt) {
		if (!dragData) {
			return;
		}

		evt.stopPropagation();

		// смотрим, на какое расстояние переместился
		// курсор с начала перетаскивания
		var dx = evt.pageX - dragData.startX;
		var dy = evt.pageY - dragData.startY;

		// смещаем элемент на такое же расстояние
		var elemX = dragData.elemX + dx;
		var elemY = dragData.elemY + dy;

		var delegate = dragData.delegate;		
		if (delegate.onMove && delegate.onMove(elemX, elemY, dx, dy) === false) {
			// коллбэк сказал, что дальше обрабатывать 
			// событие нет смысла: прекращаем работу
			return;
		}

		var style = dragData.elem.style;
		style.left = elemX + 'px';
		style.top = elemY + 'px';
	}

	function onMouseUp() {
		if (dragData) {
			var delegate = dragData.delegate;
			if (delegate.onEnd) {
				delegate.onEnd(dragData);
			}
		}
		dragData = null;
		document.removeEventListener('mousemove', onMouseMove, false);
	}

	function makeDragObject(evt, elem, delegate) {
		var offset = {
			x: elem.offsetLeft,
			y: elem.offsetTop
		};

		return {
			startX: evt.pageX,
			startY: evt.pageY,
			elem: elem,
			evt: evt,
			elemX: offset.x,
			elemY: offset.y,
			delegate: delegate
		};
	}

	document.addEventListener('mouseup', onMouseUp, false);

	return {
		makeDraggable: function(elem, delegate) {
			delegate = delegate || {};
			elem.addEventListener('mousedown', function(evt) {
				evt.stopPropagation();
				evt.preventDefault();

				dragData = makeDragObject(evt, elem, delegate);
				if (delegate.onStart) {
					var result = delegate.onStart(dragData);
					if (result === false) {
						return dragData = null;
					}
				}
				document.addEventListener('mousemove', onMouseMove, false);
			});

			elem.addEventListener('click', function(evt) {
				if (dragData) {
					// если есть dragData, значит, объект двигали и нужно отменить событие клика
					evt.stopPropagation();
				}
			});
		}
	};
});