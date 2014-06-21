var mensch = require('mensch');

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
	}
});

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.executeScript(tab.id, {file: 'chrome-app.js'});
});