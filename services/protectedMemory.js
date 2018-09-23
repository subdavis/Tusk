"use strict";

/**
 * Storage in RAM, just not in the clear.  Purpose is to prevent seeing the
 * contents in a casual scan of RAM.  Does not prevent an attacker with direct
 * access to the code from reading the contents.
 */

let Base64 = require('base64-arraybuffer')

function ProtectedMemory() {
	var my = {
		getData: getData,
		setData: setData,
		clearData: clearData,
		serialize: serialize, //not encrypted
		deserialize: deserialize, //not encrypted
		hydrate: deserialize //not encrypted
	}

	var dataMap = {};
	var AES = {
		name: "AES-CBC",
		iv: window.crypto.getRandomValues(new Uint8Array(16))
	};

	var keyPromise = initNewKey();

	function initNewKey() {
		return window.crypto.subtle.generateKey({
			name: "AES-CBC",
			length: 256
		}, false, ["encrypt", "decrypt"]);
	}

	function getData(key) {
		var encData = dataMap[key];
		if (encData === undefined || typeof (encData) !== 'string')
			return Promise.resolve(undefined);

		return keyPromise.then(key => {
			var encBytes = Base64.decode(encData);
			return window.crypto.subtle.decrypt(AES, key, encBytes);
		}).then(function (data) {
			var decoder = new TextDecoder();
			var decoded = decoder.decode(new Uint8Array(data));
			var parsed = JSON.parse(decoded)
			return dePrepData(parsed);
		});
	}

	function setData(key, data) {
		var preppedData = prepData(data);
		var encoder = new TextEncoder();
		var dataBytes = encoder.encode(JSON.stringify(preppedData));
		return keyPromise.then(key => {
			return window.crypto.subtle.encrypt(AES, key, dataBytes);
		}).then(function (encData) {
			var dataString = Base64.encode(encData);
			dataMap[key] = dataString;
			return Promise.resolve();
		});
	}

	function clearData(key) {
		if (key !== undefined) {
			delete dataMap[key]
		} else {
			dataMap = {};
			keyPromise = initNewKey();
		}
		return keyPromise
	}

	function serialize(data) {
		var preppedData = prepData(data);
		var encoder = new TextEncoder();
		var dataBytes = encoder.encode(JSON.stringify(preppedData));
		return Base64.encode(dataBytes);
	}

	function deserialize(serializedData) {
		if (serializedData === undefined || typeof (serializedData) !== 'string' || serializedData === "")
			return undefined;

		var dataBytes = Base64.decode(serializedData);
		var decoder = new TextDecoder();
		var decoded = decoder.decode(new Uint8Array(dataBytes));
		var parsed = JSON.parse(decoded);
		return dePrepData(parsed);
	}

	/**
	 * Prep data for serializing by converting ArrayBuffer properties to base64 properties
	 * Also makes a deep copy, so what is returned is not the original.
	 */
	var randomString = "Ựៅ" // Base64.encode(window.crypto.getRandomValues(new Uint8Array(4)));
	function prepData(data) {
		if (data === null || data === undefined || typeof (data) !== 'object')
			return data;

		if (data.constructor == ArrayBuffer || data.constructor == Uint8Array) {
			return randomString + Base64.encode(data);
		} else if (data.constructor == Array) {
			var newArray = new Array(data.length);
			for (var i = 0; i < data.length; i++) {
				newArray[i] = prepData(data[i]);
			}
			return newArray;
		} else {
			var newObject = {};
			for (var prop in data) {
				newObject[prop] = prepData(data[prop]);
			}
			return newObject;
		}
	}

	function dePrepData(data) {
		if (data === null || data === undefined || (typeof (data) !== 'object' && typeof (data) !== 'string'))
			return data;

		if (typeof (data) === "string") {
			if (data.indexOf(randomString) == 0) {
				data = data.slice(randomString.length);
				return new Uint8Array(Base64.decode(data));
			} else {
				return data;
			}
		} else if (data.constructor == Array) {
			for (var i = 0; i < data.length; i++) {
				data[i] = dePrepData(data[i]);
			}
		} else {
			for (var prop in data) {
				data[prop] = dePrepData(data[prop]);
			}
		}

		return data;
	}

	return my;
}

export {
	ProtectedMemory
}