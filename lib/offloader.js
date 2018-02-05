
const Base64 = require('base64-arraybuffer')

function Offloader(settings, lambda) {

	var my = {}

	function getNewKey() {
		return window.crypto.subtle.generateKey({
			name: "AES-CBC",
			length: 256
		}, false, ["encrypt", "decrypt"]);
	}

	function getNewAESAlgo() {
		return {
			name: "AES-CBC",
			iv: window.crypto.getRandomValues(new Uint8Array(16))
		};
	}

	function sha256(str) {
	  // We transform the string into an arraybuffer.
	  var buffer = new TextEncoder("utf-8").encode(str);
	  return crypto.subtle.digest("SHA-256", buffer).then(data => {
	  	return Base64.encode(data);
	  })
	}


	let getToken = (force) => {
		// Force will force a new token from the server...
		return settings.getSetOffloaderToken().then(token => {
			if (token !== null && !force) { // Token exists...
				return token;
			} else {							          // Wasn't found...
				return lambda.getToken().then(response => {
					let id = response.data.id;
					if (id !== undefined){
						return settings.getSetOffloaderToken(id)
					} else {
						return Promise.reject('Could not create a new Token')
					}
				})
			}
		})
	}

	my.encrypt = (keyname, valueString, expireTime) => {
		// We have a token for talking to the server...
		let aesAlgorithm = getNewAESAlgo()
		
		let hashPromise = sha256(keyname)
		let aesKeyPromise = getNewKey()
		let tokenPromise = getToken(false)
		return Promise.all([hashPromise, aesKeyPromise, tokenPromise]).then(values => {
			// We have a hash of the local keyname and a shiny new AES Key
			let hash = values[0];
			let aesKey = values[1];
			let token = values[2];
			let encoder = new TextEncoder();
			return window.crypto.subtle.encrypt(
					aesAlgorithm, 
					aesKey, 
					encoder.encode(valueString)
				).then(encBytes =>{
					return Base64.encode(encBytes);
				}).then(encB64 => {
					return lambda.save(hash, encB64, expireTime, token).then(response => {
						return encB64;
					})
				})
		})
	}

	my.decrypt = (keyname, encB64) => {

	}

	return my;
}

export {
	Offloader
}