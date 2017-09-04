'use strict';

function WebdavFileManager($http, settings) {
	var requestData = '<?xml version="1.0"?><D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype/></D:prop></D:propfind>',
        accessTokenType = 'webdav',
        state = {
		    loggedIn: false
	    };

	//lists databases if a token is already stored
	function listDatabasesSafe() {
		return settings.getAccessToken(accessTokenType).then(function (stored_token) {
            return stored_token ? listDatabases() : [];
		});
	}

	function login($scope) {
		return listDatabases($scope);
	}

	function logout() {
		return settings.saveAccessToken(accessTokenType, null).then(function () {
			state.loggedIn = false;
		});
	}

	function listDatabases($scope) {
		var url, auth;

		return getToken($scope).then(function (accessToken) {
			var parts = atob(accessToken.slice(3, -3)).split('#');

			auth = parts.pop();
			url = parts.pop();

			return $http({
				method: 'PROPFIND',
				url: url,
				data: requestData,
				responseType: 'document',
				headers: {
					Authorization: 'Basic ' + auth,
					Depth: '1'
				}
			});
		}).then(function (response) {
			if (response.status === 207 && getDavNodes(response.data, 'multistatus').length) {
				return Array.from(getDavNodes(response.data, 'response')).map(function (node) {
					var href, props = getDavNodes(node, 'prop')[0];

					if (!props) {
						return false;
					}

					if (getDavNodes(props, 'resourcetype') && !getDavNodes(node, 'collection').length) {
						href = getDavNodes(node, 'href');

						if (href && href.length) {
							return {
								title: href[0].textContent.replace('/' + url.split(/[\\/]/).slice(3).join('/'), '')
							}
						}
					}

					return false;
				}).filter(Boolean);
			}
			return [];
		}).catch(function () {
			return [];
		});
	}

	function getDavNodes(doc, localName) {
		return doc.getElementsByTagNameNS('DAV:', localName);
	}

	//get the minimum information needed to identify this file for future retrieval
	function getDatabaseChoiceData(dbInfo) {
		return {
			title: dbInfo.title
		}
	}

	//given minimal file information, retrieve the actual file
	function getChosenDatabaseFile(dbInfo) {
		return getToken().then(function (accessToken) {
			var parts = atob(accessToken.slice(3, -3)).split('#'),
				auth  = parts.pop(),
				url   = parts.pop();

			return $http({
				method: 'GET',
				url: url + dbInfo.title,
				responseType: 'arraybuffer',
				headers: {
					Authorization: 'Basic ' + auth
				}
			});
		}).then(function (response) {
			return response.data;
		}).catch(function (response) {
			return response;
		});
	}

	function ensureOriginPermissions($scope) {
		var webDavOrigin = [$scope.form.url.split(/[\\/]/).slice(0, 3).concat(['']).join('/')];

		return chrome.p.permissions.contains({origins: webDavOrigin}).then(function () {
			return true;
		}).catch(function() {
			return chrome.p.permissions.request({origins: webDavOrigin}).then(function () {
				return true;
			}).catch(function(err) {
				return false;
			})
		});
	}

	function getToken($scope) {
		return settings.getAccessToken(accessTokenType).then(function (stored_token) {
			if (stored_token) {
				state.loggedIn = true;
				return stored_token;
			}

			return interactiveLogin($scope).then(function (new_token) {
				return new_token;
			});
		})
	}

	function interactiveLogin($scope) {
		return ensureOriginPermissions($scope).then(function () {
			return new Promise(function (resolve, reject) {
				var accessToken, auth, rnd;

				auth = btoa($scope.form.user + ':' + $scope.form.pass);
				rnd = Base64.encode(window.crypto.getRandomValues(new Uint8Array(32)));
				accessToken = rnd.slice(0, 3) + btoa($scope.form.url + '#' + auth) + rnd.slice(-3);

				return $http({
					method: 'PROPFIND',
					url: $scope.form.url,
					data: requestData,
					responseType: 'document',
					headers: {
						Authorization: 'Basic ' + auth,
						Depth: '0'
					}
				}).then(function(response) {
					if (response.status != 207 || !getDavNodes(response.data, 'multistatus').length) {
                    	reject();
                	}

					settings.saveAccessToken(accessTokenType, accessToken).then(function () {
						resolve(accessToken);
					});
				}).catch(function (err) {
					reject(err);
				});
			});
		});
	}

    return {
        key: 'webdav',
        routePath: '/webdav',
        listDatabases: listDatabasesSafe,
        getDatabaseChoiceData: getDatabaseChoiceData,
        getChosenDatabaseFile: getChosenDatabaseFile,
        supportedFeatures: ['listDatabases'],
        title: 'WebDAV',
        icon: 'icon-webdav',
        chooseTitle: 'WebDAV',
        chooseDescription: 'Access password files via WebDAV. Files will be retrieved each time they are used.',
        interactiveLogin: interactiveLogin,
        ensureOriginPermissions: ensureOriginPermissions,
        state: state,
        login: login,
        logout: logout
    };
}
