const BASE_URL="https://api.subdavis.com/prod"

function save(key, value, ttl, token) {
	return axios({
		method: 'post',
		url: BASE_URL + "/keystore",
		data: {
			key: key,
			value: value,
			ttl: ttl
		},
		headers: {
			'Accept': 'application/json',
			'Authorization': 'Bearer ' + token
		}
	})
}

function getToken() { 
	return axios({
		method: 'post',
		url: BASE_URL + "/token",
		headers: {
			'Accept': 'application/json'
		}
	})
}

export {
	save,
	getToken
}