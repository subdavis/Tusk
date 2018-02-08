/* 
	Lambda Keystore
	A thin wrappepr on the https://github.com/subdavis/lambda-keystore
	web api.
*/

// TODO: Allow users to host their own cache backends.

const BASE_URL="https://api.subdavis.com/prod"
const utils = require('./utils.js')
import axios from 'axios/dist/axios.min.js'

function save(key, value, ttl, token) {
	return axios({
		method: 'post',
		url: BASE_URL + "/keystore",
		data: {
			key: utils.urlencode(key),
			value: value,
			ttl: ttl
		},
		headers: {
			'Accept': 'application/json',
			'Authorization': 'Bearer ' + token
		}
	})
}

function get(key, token) {
	return axios({
		method: 'get',
		url: BASE_URL + "/keystore/" + utils.urlencode(key),
		headers: {
			'Accept': 'application/json',
			'Authorization': 'Bearer ' + token
		}
	}).then(response => {
		return response.data;
	})
}

function getToken() { 
	return axios({
		method: 'post',
		url: BASE_URL + "/token",
		headers: {
			'Accept': 'application/json'
		}
	}).then(response => {
		return response.data.id;
	})
}

export {
	save,
	getToken
}