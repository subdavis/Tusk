"use strict";

/**
 * Storage in background page memory.
 */
function SecureCacheMemory(protectedMemory) {
	var exports = {}

	var awaiting = [];
	var messageReceived;
	var notifyReady;
	var ready = new Promise(function (resolve) {
		notifyReady = resolve;
	});
	exports.ready = function () {
		return ready.then(function (port) {
			return true;
		});
	};

	var promise = new Promise(function (resolve, reject) {
		messageReceived = resolve;
	});

	//init.  get tabId and open a port
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function (tabs) {
		if (tabs !== undefined && tabs.length > 0) {
			var port = chrome.runtime.connect({
				name: "tab" + tabs[0].id
			});
			notifyReady(port);
		}
	});

	ready.then(function (port) {
		port.onMessage.addListener(function (serializedSavedState) {
			//called from the background when we get a response, i.e. some saved state.
			var savedState = protectedMemory.hydrate(serializedSavedState);
			var notifier = awaiting.shift();
			notifier(savedState); //notify others
		});
		port.onDisconnect.addListener(function (p) {
			// Nothing to do here yet...
		})
	});

	//wake up the background page and get a pipe to send/receive messages:
	exports.get = function (key) {
		ready.then(function (port) {
			port.postMessage({
				action: 'get',
				key: key
			});
		});

		var p = new Promise(function (resolve) {
			awaiting.push(resolve);
		});

		return p; //will resolve when we get something
	}

	exports.clear = function (key) {
		return ready.then(function (port) {
			port.postMessage({
				action: 'clear',
				key: key
			});
		})
	}

	exports.save = function (key, value) {
		return ready.then(function (port) {
			var serializedValue = protectedMemory.serialize(value);
			port.postMessage({
				action: 'save',
				key: key,
				value: serializedValue
			});
		})
	}

	exports.forgetStuff = function () {
		// Causes forgetStuff to run in the event page.
		return ready.then(port => {
			port.postMessage({
				action: 'forgetStuff'
			})
		})
	}

	return exports;
}

export {
	SecureCacheMemory
}