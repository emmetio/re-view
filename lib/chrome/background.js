var mensch = require('mensch');
var tarea = null;


function loadCSS(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, false);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			try {
				var ast = mensch.parse(xhr.responseText);
				callback({ast: JSON.stringify(ast)});
			} catch (e) {
				callback({err: e});
			}
		}
	};

	try {
		xhr.send();
	} catch (e) {
		callback({err: e});
	}
}

// listend to incoming messages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.action) {
		case 'loadCSS':
			return loadCSS(request.data.url, sendResponse);
		case 'clipboardCopy':
			if (!tarea) {
				tarea = document.createElement('textarea');
				document.body.appendChild(tarea);
			}
			tarea.value = request.data;
			tarea.select();
			return document.execCommand("copy", false, null);
	}
});

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.insertCSS(tab.id, {file: 'ui.css'});
	chrome.tabs.executeScript(tab.id, {file: 'app.js'});
});