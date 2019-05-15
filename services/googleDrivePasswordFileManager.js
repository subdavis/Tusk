const Base64 = require('base64-arraybuffer')
const axios = require('axios')
import {
	ChromePromiseApi
} from '$lib/chrome-api-promise.js'
import {
	urlencode
} from '$lib/utils.js'
import {
	OauthManager
} from '$services/oauthManager.js'

const chromePromise = ChromePromiseApi()

function GoogleDrivePasswordFileManager(settings) {
	var accessTokenType = 'gdrive';

	var state = {
		loggedIn: false
	}

	var oauth = {
		key: accessTokenType,
		accessTokenType: accessTokenType,
		supportedFeatures: ['listDatabases'],
		authUrl: `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.readonly')}`,
		origins: [
			"https://www.googleapis.com/*",
			"https://accounts.google.com/*",
			"https://*.googleusercontent.com/*",
		],
		title: 'Google Drive',
		icon: 'icon-google',
		chooseTitle: 'Google Drive',
		chooseDescription: 'Access password files stored on Google Drive.  Files will be fetched from Google Drive each time they are used.',
	};

	oauth.searchRequestFunction = function (token) {
		var request = {
			method: 'GET',
			url: "https://www.googleapis.com/drive/v2/files?q=" + urlencode("fileExtension = 'kdbx' and trashed=false"),
			headers: {
				'Authorization': 'Bearer ' + token
			}
		}
		return axios(request)
	}

	oauth.searchRequestHandler = function (response) {
		return response.data.items.map(function (entry) {
			return {
				title: entry.title,
				url: entry.selfLink
			}
		})
	}

	//get the minimum information needed to identify this file for future retrieval
	oauth.getDatabaseChoiceData = function (dbInfo) {
		return {
			title: dbInfo.title,
			url: dbInfo.url
		}
	}

	//given minimal file information, retrieve the actual file
	oauth.fileRequestFunction = function (dbInfo, token) {
		function getFileFromDatabase(attempt) {
			var requestmeta = {
				method: "GET",
				url: dbInfo.url,
				headers: {
					'Authorization': 'Bearer ' + token
				}
			}
			return axios(requestmeta).then(response => {
				var requestfile = {
					method: 'GET',
					url: response.data.downloadUrl,
					responseType: 'arraybuffer',
					headers: {
						'Authorization': 'Bearer ' + token
					}
				};
				return axios(requestfile).then(response => {
					return response
				})
					.catch(err => {
						attempt = attempt || 0;
						if (attempt == 0) {
							//sometimes the url returned returns 403 OK, because somehow it is invalid.  In this scenario, try again to get a working url
							return getFileFromDatabase(1)
						} else {
							return Promise.reject(err)
						}
					});
			})
		}
		return getFileFromDatabase(0)
	}

	oauth.revokeAuth = function () {
		return settings.getSetAccessToken(accessTokenType).then(function (accessToken) {
			if (accessToken) {
				var url = 'https://accounts.google.com/o/oauth2/revoke?token=' + accessToken
				return axios({
					url: url,
					responseType: 'jsonp'
				}).catch(err => {
					// Assume the request failed because the token was already bad...
					console.error(err)
					return Promise.resolve();
				})
			} else {
				return Promise.resolve();
			}
		})
	}

	oauth.handleAuthRedirectURI = function (redirect_url, randomState, resolve, reject) {
		var tokenMatches = /access_token=([^&]+)/.exec(redirect_url);
		var stateMatches = /state=([^&]+)/.exec(redirect_url);

		if (tokenMatches && stateMatches) {
			var access_token = tokenMatches[1];
			var checkState = decodeURIComponent(stateMatches[1]);
			if (checkState === randomState) {
				settings.getSetAccessToken(accessTokenType, access_token).then(function () {
					resolve(access_token);
				});
			} else {
				//some sort of error or parsing failure
				reject(redirect_url);
				console.error("Auth error with state", redirect_url);
			}
		} else {
			//some sort of error
			reject(redirect_url)
			console.error("Auth Error", redirect_url);
		}
	}

	function chrome_auth(interactive) {
		// chrome_auth is an alternative auth function run when the 
		// browser is Chrome.  It uses chrome.identity.getAuthToken rather than
		// a standard Oauth flow.
		interactive = !!interactive;
		return new Promise(function (resolve, reject) {
			chrome.identity.getAuthToken({
				interactive: interactive
			}, function (token) {
				if (token)
					settings.getSetAccessToken(accessTokenType, token).then(function () {
						resolve(token);
					});
				else {
					let err = chrome.runtime.lastError;
					if (!err) {
						err = new Error("Failed to authenticate.");
					}
					if (err.message == "OAuth2 not granted or revoked.") {
						//too confusing
						reject(new Error("You must Authorize google drive access to continue."))
					} else {
						reject(err);
					}
				}
			});
		});
	}

	// If this browser has the getAuthToken function...  Hack for #64
	// There is the getAuthToken function in Opera, but it isn't supported. Detect Opera by the chrome.search function.
	try {
	    if (chrome.identity.getAuthToken !== undefined && chrome.search === undefined && !window.navigator.userAgent.match("Vivaldi")) {
			oauth['auth'] = chrome_auth;
		}
	}
	catch (e) {
		console.info("Firefox mobile detected.")
	}


	return OauthManager(settings, oauth)
}

export {
	GoogleDrivePasswordFileManager
}
