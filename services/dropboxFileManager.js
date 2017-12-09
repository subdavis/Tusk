"use strict";

import axios from 'axios/dist/axios.min.js'
let Base64 = require('base64-arraybuffer')
import { ChromePromiseApi } from '$lib/chrome-api-promise.js'

const chromePromise = ChromePromiseApi()

function DropboxFileManager(settings) {
	var accessTokenType = 'dropbox';

	var state = {
		loggedIn: false
	}

	var exports = {
		key: 'dropbox',
		listDatabases: listDatabasesSafe,
		getDatabaseChoiceData: getDatabaseChoiceData,
		getChosenDatabaseFile: getChosenDatabaseFile,
		supportedFeatures: ['ingognito', 'listDatabases'],
		title: 'Dropbox',
		icon: 'icon-dropbox',
		permissions: ['https://*.dropbox.com/'],
		chooseTitle: 'Dropbox',
		chooseDescription: 'Access password files stored on Dropbox.  Files will be retrieved from Dropbox each time they are used.',
		interactiveLogin: auth,
		ensureOriginPermissions: ensureOriginPermissions,
		state: state,
		login: login,
		isLoggedIn: isLoggedIn,
		logout: logout
	};

	//lists databases if a token is already stored
	function listDatabasesSafe() {
		return settings.getAccessToken(accessTokenType).then(function(stored_token) {
			if (stored_token) {
				return listDatabases();
			} else {
				return [];
			}
		});
	}

	function login() {
		return auth(true);
	}

	function isLoggedIn () {
		return settings.getAccessToken(accessTokenType).then(stored_token => {
			return !!stored_token
		})
	}

	function logout() {
		return settings.saveAccessToken(accessTokenType, null).then(function() {
			state.loggedIn = false;
		});
	}

	function getDatabases(extension) {
		return getToken().then(function(accessToken) {
			return axios({
				method: 'post',
				url: 'https://api.dropbox.com/2/files/search',
				data: {
					path: '',
					query: extension,
					start: 0,
					max_results: 100,
					mode: 'filename'
				},
				headers: {
					'Authorization': 'Bearer ' + accessToken
				}
			}).then(response => {
				// SUCCESS!
				return response.data.matches.map(function(fileInfo) {
					return {
						title: fileInfo.metadata.path_display
					};
				});
			})
		})
	}

	function listDatabases() {
		console.log("List Databsaes")
		return getDatabases('.kdbx').catch(error => {
			// FAIL
			let status = error.response.status;
			if (status == 401) {
				//unauthorized, means the token is bad.  retry with new token.
				return auth(false).then(listDatabases);
			} else if (!status) {
				// network error
				throw new Error("Network Connection Error")
			}
		});
	}

	//get the minimum information needed to identify this file for future retrieval
	function getDatabaseChoiceData(dbInfo) {
		return {
			title: dbInfo.title
		}
	}

	function http_header_safe_json(v) {
		var charsToEncode = /[\u007f-\uffff]/g;
 		return JSON.stringify(v).replace(charsToEncode,
			function(c) {
				return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4);
			}
	 	);
	}

	//given minimal file information, retrieve the actual file
	function getChosenDatabaseFile(dbInfo) {
		return getToken().then(function(accessToken) {
			var arg = {
				"path": dbInfo.title
			}
			return axios({
				method: 'post',
				url: 'https://api-content.dropbox.com/2/files/download',
				responseType: 'arraybuffer',
				headers: {
					'Authorization': 'Bearer ' + accessToken,
					'Dropbox-API-Arg': http_header_safe_json(arg)
				}
			}).then(function(response) {
				return response.data;
			}).catch(function(response) {
				if (response.status == 401) {
					//unauthorized, means the token is bad.  retry with new token.
					return auth(false).then(function() {
						return getChosenDatabaseFile(dbInfo);
					});
				}
			});
		});
	}

	function ensureOriginPermissions() {
		var dropboxOrigins = ['https://*.dropbox.com/'];
		return chromePromise.permissions.contains({origins: dropboxOrigins}).then(function() {
			return true;
		}).catch(function() {
			return chromePromise.permissions.request({origins: dropboxOrigins}).then(function() {
				return true;
			}).catch(function(err) {
				return false;
			})
		});
	}

	function getToken() {
		return settings.getAccessToken(accessTokenType).then(function(stored_token) {
			if (stored_token) {
				state.loggedIn = true;
				return stored_token;
			}

			return auth(false).then(function(new_token) {
				return new_token;
			});
		})
	}

	function auth(interactive) {
		interactive = !!interactive;
		return ensureOriginPermissions().then(ensured => {
			return new Promise(function(resolve, reject) {
				chromePromise.runtime.getManifest().then(manifest => {
					var randomState = Base64.encode(window.crypto.getRandomValues(new Uint8Array(16)));  //random state, protects against CSRF
					var authUrl = 'https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=' + manifest.static_data.dropbox.client_id
						+ '&state=' + encodeURIComponent(randomState)
						+ '&redirect_uri=' + encodeURIComponent(chrome.identity.getRedirectURL('dropbox'))
						+ '&force_reapprove=false';
					console.log("BeforeLaunch", authUrl);
					chromePromise.identity.launchWebAuthFlow({'url': authUrl, 'interactive': interactive}).then(function(redirect_url) {
						console.log("After", redirect_url);
						var tokenMatches = /access_token=([^&]+)/.exec(redirect_url);
						var stateMatches = /state=([^&]+)/.exec(redirect_url);
						var uidMatches = /uid=(\d+)/.exec(redirect_url);

						if (tokenMatches && stateMatches && uidMatches) {
							var access_token = tokenMatches[1];
							var checkState = decodeURIComponent(decodeURIComponent(stateMatches[1]));  //I have no idea why it is double-encoded
							var uid = uidMatches[1];
							if (checkState === randomState) {
								state.loggedIn = true;
								settings.saveAccessToken(accessTokenType, access_token).then(function() {
									resolve(access_token);
								});
							} else {
								//some sort of error or parsing failure
								reject();
								console.log(redirect_url);
							}
						} else {
							//some sort of error
							reject()
							console.log(redirect_url);
						}
					}).catch(function(err) {
						console.error(err);
						reject(err);
					});
				});
			});
		});
	}

	return exports;
}

export { DropboxFileManager }