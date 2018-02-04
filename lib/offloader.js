const BASE_URL="https://api.subdavis.com/prod"
const Base64 = require('base64-arraybuffer')

function Offloader(settings) {

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
	  	return Base64.decode(data);
	  })
	}

	/*
	return axios({
			method: 'post',
			url: 'https://api.dropbox.com/2/files/search',
			data: {
				path: '',
				query: 'kdbx',
				start: 0,
				max_results: 100,
				mode: 'filename'
			},
			headers: {
				'Authorization': 'Bearer ' + token
			}
		})
		*/

	let getToken = (force) => {
		// Force will force a new token from the server...
		let current = settings.getSetOffloaderToken()
		return current.then(token => {
			if (token !== null && !force) { // Token exists...
				return token
			} else {							// Wasn't found...
				return axios({
					method: 'post',
					url: BASE_URL + "/token",
					headers: {
						'Accept': 'application/json'
					}
				}).then(response => {
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
		return getToken(false).then(t => {
			// We have a token for talking to the server...
			let aesAlgorithm = getNewAESAlgo()
			let hashPromise = sha256(keyname)
			let aesKeyPromise = getNewKey()
			return Promise.all([hashPromise, aesKeyPromise]).then(values => {
				let hash = values[0];
				let aesKey = values[1];
				let encoder = new TextEncoder();
				let encB64Promise = window.subtle.encrypt(
						algorithm, 
						aesKey, 
						encoder.encode(valueString)
					).then(encBytes =>{
						return Base64.encode(encBytes);
					})
				return encB64Promise.then(encB64 => {
					return axios({
						method: 'post',
						url: BASE_URL + "/keystore",
						data: {
							key: hash,
							value: ,
							ttl: expireTime
						},
						headers: {
							'Accept': 'application/json'
						}
					})
				})
			})
		})
	}

	my.decrypt = (keyname, encB64) => {

	}
}

export {
	Offloader
}