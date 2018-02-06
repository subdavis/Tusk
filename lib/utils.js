
const Base64 = require('base64-arraybuffer')

const urlencode = function(str) {
	// https://stackoverflow.com/questions/10896807/javascript-encodeuricomponent-doesnt-encode-single-quotes?foo=%27%27
	return encodeURIComponent(str).replace(/[!'()*]/g, escape);
}

const getValidTokens = tokenString => {
	if (!tokenString)
		return []
	else
		return tokenString.toLowerCase().split(/\.|\s|\//).filter(t => {
			return (t && t !== "com" && t !== "www" && t.length > 1)
		})
} // end getValidTokens

const parseUrl = url => {
	if (url && !url.indexOf('http') == 0)
		url = 'http://' + url
	//from https://gist.github.com/jlong/2428561
	var parser = document.createElement('a')
	parser.href = url
	return parser
} // end parseUrl

const encrypt = function(valueString) {
	// A sepcial encryptor that generates a new key and
	// returns it along with the encoded encrypted data
	function getNewKey() {
		return window.crypto.subtle.generateKey({
			name: "AES-CBC",
			length: 256
		}, true, ["encrypt", "decrypt"]);
	}

	function getNewAESAlgo() {
		return {
			name: "AES-CBC",
			iv: window.crypto.getRandomValues(new Uint8Array(16))
		};
	}

	let aesKeyPromise = getNewKey()
	let aesAlgorithm = getNewAESAlgo()
	let encoder = new TextEncoder();
	return aesKeyPromise.then(aesKey => {
		let exportedJWKPromise = window.crypto.subtle.exportKey('jwk', aesKey)
		let encryptedStringPromise = window.crypto.subtle.encrypt(
				aesAlgorithm, 
				aesKey, 
				encoder.encode(valueString)
			).then(encBytes =>{
				return Base64.encode(encBytes);
			});
		return Promise.all([encryptedStringPromise, exportedJWKPromise]).then(values => {
			return [values[0], {
				"jwk": values[1],
				"iv": Array.from(aesAlgorithm.iv)
			}];
		});
	})
}

const decrypt = function(aesDataString, encB64) {
	let aesData = JSON.parse(aesDataString);
	let jwk = aesData.jwk;
	let aesIV = aesData.iv;
	let aesAlgorithm = {
		name: "AES-CBC",
		iv: Uint8Array.from(aesIV)
	};
	let decoder = new TextDecoder();
	let encBytes = Base64.decode(encB64);
	return window.crypto.subtle.importKey('jwk', jwk, 'AES-CBC', false, ["encrypt", "decrypt"]).then(key => {
		return window.crypto.subtle.decrypt(aesAlgorithm, key, encBytes).then(decBytes => {
			return decoder.decode(decBytes);
		})
	});
}

export {
	getValidTokens,
	parseUrl,
	urlencode,
	encrypt, 
	decrypt
}