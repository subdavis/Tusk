"use strict";

/**
 * Parses a KeePass key file
 */
const Base64 = require('base64-arraybuffer')

function KeyFileParser() {
	var exports = {

	};

	function hex2arr(hex) {
		try {
			var arr = [];
			for (var i = 0; i < hex.length; i += 2)
				arr.push(parseInt(hex.substr(i, 2), 16));
			return arr;
		} catch (err) {
			return [];
		}
	}

	exports.getKeyFromFile = function (keyFileBytes) {
		var arr = new Uint8Array(keyFileBytes);
		if (arr.byteLength == 0) {
			return Promise.reject(new Error('The key file cannot be empty'));
		} else if (arr.byteLength == 32) {
			//file content is the key
			return Promise.resolve(arr);
		} else if (arr.byteLength == 64) {
			//file content may be a hex string of the key
			var decoder = new TextDecoder();
			var hexString = decoder.decode(arr);
			var newArr = hex2arr(hexString);
			if (newArr.length == 32) {
				return Promise.resolve(newArr);
			}
		}

		//attempt to parse xml
		try {
			var decoder = new TextDecoder();
			var xml = decoder.decode(arr);
			var parser = new DOMParser();
			var doc = parser.parseFromString(xml, "text/xml");
			var keyNode = doc.evaluate('//KeyFile/Key/Data', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
			if (keyNode.singleNodeValue && keyNode.singleNodeValue.textContent) {
				return Promise.resolve(Base64.decode(keyNode.singleNodeValue.textContent));
			}
		} catch (err) {
			//continue, not valid xml keyfile
		}

		var SHA = {
			name: "SHA-256"
		};

		return window.crypto.subtle.digest(SHA, arr);
	}

	return exports;
}

export {
	KeyFileParser
}