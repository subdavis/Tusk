"use strict";

import axios from 'axios/dist/axios.min.js'
let Base64 = require('base64-arraybuffer')
import { ChromePromiseApi } from '$lib/chrome-api-promise.js'
const chromePromise = ChromePromiseApi()

function OauthManager(settings, oauth) {
	/*oauth contains the following properties:
		{
			accessTokenType      // provider name
			origins              // permissions needed
			title
			icon
			chooseTitle
			chooseDescription
			authURL               // state, redirect_uri, client_id will be added.

			searchRequestFunction // function(token) > axios_response
			searchRequestHandler  // function(axios_response)  > dbInfo

			fileRequestFunction   // function(dbinfo, token) > axios_response with response.data = arraybuffer

			getDatabaseChoiceData // function(dbInfo) > dbInfo

			revokeAuth            // function takes no params > null
			handleAuthRedirectURI // function (uri, resolve, reject) > token
		}
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
		return oauth.revokeAuth().then(function() {
			return settings.saveAccessToken(accessTokenType, null).then(function() {
				state.loggedIn = false;
			});
		})
	}

	function getDatabases() {
		return getToken()
			.then(oauth.searchRequestFunction)
			.then(oauth.searchRequestHandler)
	}

	function listDatabases(attempt) {
		return getDatabases().catch(error => {
			
			let status = error.response.status;
			attempt = attempt || 0
			
			if (attempt > 0)
				throw new Error(error)
			
			if (status == 401 || status == 403) {
				//unauthorized or forbidden, means the token is bad.  retry with new token.
				return auth(false).then(token => {
					return listDatabases(1)
				});
			} else if (!status) {
				// network error
				throw new Error("Network Connection Error")
			}
		});
	}

	//given minimal file information, retrieve the actual file
	function getChosenDatabaseFile(dbInfo) {
		return getToken().then(function(accessToken) {
			return oauth.fileRequestFunction(dbInfo, accessToken).then(function(response) {
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
		return chromePromise.permissions.contains({origins: oauth.origins}).then(function() {
			return true;
		}).catch(function() {
			return chromePromise.permissions.request({origins: oauth.origins}).then(function() {
				return true;
			}).catch(function(err) {
				return false;
			})
		});
	}

	function getToken() {
		return ensureOriginPermissions().then(ensured => {
			if (ensured) {
				return settings.getAccessToken(accessTokenType).then(function(stored_token) {
					if (stored_token) {
						state.loggedIn = true;
						return stored_token;
					}
					return auth(false)
				})
			}
		})
	}

	function removeToken () {
    return settings.saveAccessToken(accessTokenType, null);
  }

	function auth(interactive) {
		interactive = !!interactive;
		console.info("Authenticating for ", oauth.accessTokenType, interactive)
		return ensureOriginPermissions().then(ensured => {
			return new Promise(function(resolve, reject) {
				chromePromise.runtime.getManifest().then(manifest => {
					var randomState = Base64.encode(window.crypto.getRandomValues(new Uint8Array(16)));  //random state, protects against CSRF
					var authUrl = oauth.authUrl
					  + '&client_id=' + manifest.static_data[oauth.accessTokenType].client_id
						+ '&state=' + encodeURIComponent(randomState)
						+ '&redirect_uri=' + encodeURIComponent(chrome.identity.getRedirectURL(oauth.accessTokenType));
					chromePromise.identity.launchWebAuthFlow({'url': authUrl, 'interactive': interactive}).then(function(redirect_url) {
						oauth.handleAuthRedirectURI(redirect_url, randomState, resolve, reject)
					}).catch(function(err) {
						console.error("Error from webauthflow", err);
						reject(err);
					});
				});
			}).then(token => {
				if (token){
					console.info("Successfully logged into", oauth.accessTokenType)
					state.loggedIn = true
				}
				return token;
			});
		});
	}

	return exports;
}

export { OauthManager }