/**

The MIT License (MIT)

Copyright (c) 2015 Steven Campbell.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

 */

"use strict";

function DropboxFileManager($http, settings) {
	var state = {
		loggedIn: false
	}
	var exports = {
		key: 'dropbox',
		premium: true,
		routePath: '/dropbox',
		listDatabases: listDatabases,
		getDatabaseChoiceData: getDatabaseChoiceData,
		getChosenDatabaseFile: getChosenDatabaseFile,
		supportedFeatures: ['ingognito', 'listDatabases'],
		title: 'Dropbox',
		icon: 'icon-dropbox',
		chooseTitle: 'Dropbox',
		chooseDescription: 'Access password files stored on Dropbox.  Files will be retrieved from Dropbox each time they are used.',
		interactiveLogin: interactiveLogin,
		ensureOriginPermissions: ensureOriginPermissions,
		state: state
	};

	function listDatabases() {
		return getToken().then(function(accessToken) {
			var req = {
				method: 'GET', 
				url: 'https://api.dropbox.com/1/search/auto/',
				params: {
					query: '.kdbx .kdb'
				},
				headers: {
					'Authorization': 'Bearer ' + accessToken
				}
			};

			return $http(req);
		}).then(function(response) {
			return response.data.map(function(fileInfo) {
				return {
					title: fileInfo.path
				};
			});
		}).catch(function(response) {
			if (response.status == 401) {
				//unauthorized, means the token is bad.  retry with new token.
				return interactiveLogin().then(listDatabases);
			}
		});
	}

	//get the minimum information needed to identify this file for future retrieval
	function getDatabaseChoiceData(dbInfo) {
		return {
			title: dbInfo.title
		}
	}

	//given minimal file information, retrieve the actual file
	function getChosenDatabaseFile(dbInfo) {
		return getToken().then(function(accessToken) {
			return $http({
				method: 'GET',
				url: 'https://api-content.dropbox.com/1/files/auto' + dbInfo.title,
				responseType: 'arraybuffer',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				}
			})
		}).then(function(response) {
			return response.data;
		}).catch(function(response) {
			if (response.status == 401) {
				//unauthorized, means the token is bad.  retry with new token.
				return interactiveLogin().then(function() {
					return getChosenDatabaseFile(dbInfo);
				});
			}
		});
	}

	function ensureOriginPermissions() {
		var dropboxOrigins = ['https://*.dropbox.com/'];
		return chrome.p.permissions.contains({origins: dropboxOrigins}).then(function() {
			return true;
		}).catch(function() {
			return chrome.p.permissions.request({origins: dropboxOrigins}).then(function() {
				return true;
			}).catch(function(err) {
				return false;
			})
		});
	}

	function getToken() {
		return settings.getDropboxToken().then(function(stored_token) {
			if (stored_token) {
				state.loggedIn = true;
				return stored_token;
			}

			return interactiveLogin().then(function(new_token) {
				return new_token;
			});
		})
	} 

	function interactiveLogin() {
		return ensureOriginPermissions().then(function() {
			return new Promise(function(resolve, reject) {
				var randomState = Base64.encode(window.crypto.getRandomValues(new Uint8Array(16)));  //random state, protects against CSRF
				var authUrl = 'https://www.dropbox.com/1/oauth2/authorize?response_type=token&client_id=6kxu9nd18t4g74m'
					+ '&state=' + encodeURIComponent(randomState)
					+ '&redirect_uri=' + encodeURIComponent(chrome.identity.getRedirectURL('dropbox'))
					+ '&force_reapprove=false';

				chrome.p.identity.launchWebAuthFlow({'url': authUrl, 'interactive': true}).then(function(redirect_url) {
					//console.log(redirect_url); 
					var tokenMatches = /access_token=([^&]+)/.exec(redirect_url);
					var stateMatches = /state=([^&]+)/.exec(redirect_url);
					var uidMatches = /uid=(\d+)/.exec(redirect_url);

					if (tokenMatches && stateMatches && uidMatches) {
						var access_token = tokenMatches[1];
						var checkState = decodeURIComponent(decodeURIComponent(stateMatches[1]));  //I have no idea why it is double-encoded
						var uid = uidMatches[1];
						if (checkState === randomState) {
							state.loggedIn = true;
							settings.saveDropboxToken(new_token).then(function() {
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
					reject(err);
				});		
			});
		});
	}

	return exports;
}
