
const Base64 = require('base64-arraybuffer')
const utils = require('./utils.js')

function Offloader(settings, lambda) {

	var my = {}

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
				return lambda.getToken().then(newToken => {
					if (newToken !== undefined){
						return settings.getSetOffloaderToken(newToken)
					} else {
						return Promise.reject('Could not create a new Token')
					}
				})
			}
		})
	}

	my.encrypt = (keyname, valueString, expireTime) => {
		// We have a token for talking to the server...
		let hashPromise = sha256(keyname)
		let tokenPromise = getToken(false)
		return Promise.all([hashPromise, tokenPromise]).then(values_a => {
			// We have a hash of the local keyname and a shiny new AES Key
			let hash = values_a[0];
			let token = values_a[1];
			return utils.encrypt(valueString).then(values_b=> {
				let encB64 = values_b[0];
				let dataForLambda = values_b[1];
				return lambda.save(hash, JSON.stringify(dataForLambda), expireTime, token).then(response => {
					return encB64;
				});
			});
		});
	}

	my.decrypt = (keyname, encB64) => {
		let hashPromise = sha256(keyname)
		let tokenPromise = getToken(false)
		return Promise.all([hashPromise, tokenPromise]).then(values_a=>{
			let hash = values_a[0];
			let token = values_a[1];
			return lambda.get(hash, token).then(aesDataString => {
				return utils.decrypt(aesDataString, encB64);
			});
		});
	}

	return my;
}

export {
	Offloader
}