"use strict";
const Base64 = require('base64-arraybuffer')
import {
	ChromePromiseApi
} from '$lib/chrome-api-promise.js'
const chromePromise = ChromePromiseApi()

function OauthManager(settings, oauth) {
	/*
		Takes:
			- settings - an instance of services/settings.js
			- oauth    - {
				// PROPERTIES
				accessTokenType      // provider name
				origins              // permissions needed
				title
				icon
				chooseTitle
				chooseDescription
				authUrl               // state, redirect_uri, client_id will be added.

				// FUNCTIONS
				searchRequestFunction // function(token) > axios response promise
				searchRequestHandler  // function(axios_response)  > dbInfo
				fileRequestFunction   // function(dbinfo, token) > axios response with response.data = arraybuffer
				getDatabaseChoiceData // function(dbInfo) > dbInfo
				revokeAuth            // function takes no params > promise resolved with null
				handleAuthRedirectURI // function (uri, randomState, resolve, reject) > promise resolved with token
			}
		Returns:
			- the exports object it creates.
	*/
	var accessTokenType = oauth.accessTokenType

	var state = {
		loggedIn: false
	}

	var exports = {
		key: accessTokenType,
		listDatabases: listDatabasesSafe,
		getDatabaseChoiceData: oauth.getDatabaseChoiceData,
		getChosenDatabaseFile: getChosenDatabaseFile,
		supportedFeatures: ['ingognito', 'listDatabases'],
		title: oauth.title,
		icon: oauth.icon,
		permissions: oauth.permissions,
		chooseTitle: oauth.chooseTitle,
		chooseDescription: oauth.chooseDescription,
		interactiveLogin: login,
		ensureOriginPermissions: ensureOriginPermissions,
		state: state,
		login: login,
		isLoggedIn: isLoggedIn,
		logout: logout
	};

	function getToken() {
		return ensureOriginPermissions().then(ensured => {
			if (ensured) {
				return settings.getSetAccessToken(accessTokenType).then(function (stored_token) {
					if (stored_token) {
						state.loggedIn = true;
						return stored_token;
					}
					return auth(false) // try passive auth if there's no token...
				})
			}
		})
	}

	function removeToken() {
		return settings.getSetAccessToken(accessTokenType, null);
	}

	//lists databases if a token is already stored
	function listDatabasesSafe() {
		return settings.getSetAccessToken(accessTokenType).then(function (stored_token) {
			if (stored_token) {
				return listDatabases();
			} else {
				return [];
			}
		});
	}

	function getDatabases() {
		return getToken()
			.then(oauth.searchRequestFunction)
			.then(oauth.searchRequestHandler)
	}

	function listDatabases(attempt) {
		return getDatabases().catch(error => {

			let status = error.response.status
			attempt = attempt || 0

			if (attempt > 0)
				throw new Error(error)

			if (status >= 400 && status <= 599) {
				console.error("listDatabases failed with status code", status)
				//unauthorized or forbidden, means the token is bad.  retry with new token.
				let timeoutPromise = new Promise((resolve, reject) => {
					let waiter = setTimeout(() => {
						clearTimeout(waiter)
						console.info("First attempt to listDatabases failed, waiting....")
						resolve(false) // false for no auth intaractivity
					}, 400) // Wait 400 MS before trying again
				})
				return timeoutPromise
					.then(auth) // try passive auth if something failed.
					.then(token => {
						return listDatabases(1)
					});
			} else if (!status) {
				throw new Error("Network Connection Error")
			}
		});
	}

	function login() {
		return auth(true)
	}

	function isLoggedIn() {
		return new Promise((resolve, reject) => {
			resolve(state.loggedIn)
		})
	}

	function logout() {
		return oauth.revokeAuth().then(function () {
			return removeToken().then(function () {
				state.loggedIn = false
			})
		})
	}

	//given minimal file information, retrieve the actual file
	function getChosenDatabaseFile(dbInfo, attempt) {
		return getToken().then(function (accessToken) {
			return oauth.fileRequestFunction(dbInfo, accessToken).then(function (response) {
				return response.data
			}).catch(function (error) {
				console.error("Get chosen file failure:", error)
				if (error.response === undefined)
					return Promise.reject({ message: "No network connection" })
				if (error.response.status == 401) {
					//unauthorized, means the token is bad.  retry with new token.
					console.error("Stale token sent for " + oauth.accessTokenType + ": trying passive Oauth Refresh.")
					return auth(false).then(function () {
						return getChosenDatabaseFile(dbInfo);
					})
				}
			})
		})
	}

	function ensureOriginPermissions() {
		return chromePromise.permissions.contains({
			origins: oauth.origins
		}).then(function () {
			return true;
		}).catch(function () {
			return chromePromise.permissions.request({
				origins: oauth.origins
			}).then(function () {
				return true;
			}).catch(function (err) {
				return false;
			})
		});
	}

	function auth(interactive) {
		interactive = !!interactive;
		console.info("Authenticating for ", oauth.accessTokenType, interactive)

		let authfunction = is_interactive => {
			return new Promise(function (resolve, reject) {
				chromePromise.runtime.getManifest().then(manifest => {
					//random state, protects against CSRF
					var randomState = Base64.encode(window.crypto.getRandomValues(new Uint8Array(16)));
					var authUrl = oauth.authUrl +
						'&client_id=' + manifest.static_data[oauth.accessTokenType].client_id +
						'&state=' + encodeURIComponent(randomState) +
						'&redirect_uri=' + encodeURIComponent(chrome.identity.getRedirectURL(oauth.accessTokenType));
					console.info("Sending request for AUTH to", oauth.authUrl);
					chromePromise.identity.launchWebAuthFlow({
						'url': authUrl,
						'interactive': is_interactive
					}).then(redirect_url => {
						oauth.handleAuthRedirectURI(redirect_url, randomState, resolve, reject);
					}).catch(function (err) {
						console.error("Error from webauthflow for", oauth.accessTokenType, err);
						reject(err);
					});
				});
			})
		}

		// If the oauth provider has chosen to implement its own auth function.
		authfunction = oauth.auth !== undefined ? oauth.auth : authfunction;

		return ensureOriginPermissions().then(ensured => {
			return authfunction(interactive).then(token => {
				if (token) {
					console.info("Successfully logged into", oauth.accessTokenType);
					state.loggedIn = true;
				}
				return token;
			});
		});
	}

	return exports;
}

export {
	OauthManager
}