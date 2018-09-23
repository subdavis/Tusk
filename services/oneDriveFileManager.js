"use strict";
const axios = require('axios')
import {
	ChromePromiseApi
} from '$lib/chrome-api-promise.js'
import {
	OauthManager
} from '$services/oauthManager.js'

const chromePromise = ChromePromiseApi()

function OneDriveFileManager(settings) {
	var accessTokenType = 'onedrive';
	var state = {
		loggedIn: false
	}
	var oauth = {
		key: accessTokenType,
		accessTokenType: accessTokenType,
		authUrl: 'https://login.live.com/oauth20_authorize.srf?response_type=token' +
			'&scope=' + encodeURIComponent('onedrive.readonly'),
		supportedFeatures: ['listDatabases'],
		origins: ['https://login.live.com/'],
		title: 'OneDrive',
		icon: 'icon-onedrive',
		chooseTitle: 'OneDrive',
		chooseDescription: 'Access password files stored on OneDrive.  Files will be retrieved from OneDrive each time they are used.',
	};

	oauth.searchRequestFunction = function (token) {
		var query = 'kdbx';
		var filter = encodeURIComponent('file ne null');
		var url = 'https://api.onedrive.com/v1.0/drive/root/view.search?q=' + query + '&filter=' + filter;
		return axios({
			method: 'GET',
			url: url,
			headers: {
				Authorization: 'Bearer ' + token
			}
		})
	}

	oauth.searchRequestHandler = function (response) {

		function transformFile(file) {
			var path = "";
			if (file.parentReference) {
				// path will be e.g. "/drive/root:/Documents"
				path = file.parentReference.path;

				// extract the part after the colon, so "/Documents"
				var split = /:(.+)$/.exec(path);
				if (split) {
					path = split[1];
				}

				if (!/\/$/.exec(path)) {
					// append trailing slash, if there was none
					path += "/";
				}
			}

			return {
				url: file['@content.downloadUrl'],
				title: path + file.name
			}
		}

		if (!response) {
			return Promise.reject('Unable to get a response from OneDrive');
		}
		if (!response.data.value) {
			return Promise.reject('Unexpected response from OneDrive API');
		}

		// only return files that have a .kdbx extension
		var files = response.data.value.filter(function (file) {
			return file.name && /\.kdbx?$/.exec(file.name);
		});

		return files.map(transformFile);
	}

	//get the minimum information needed to identify this file for future retrieval
	oauth.getDatabaseChoiceData = function (dbInfo) {
		return {
			url: dbInfo.url,
			title: dbInfo.title
		};
	}

	//given minimal file information, retrieve the actual file
	oauth.fileRequestFunction = function (dbInfo, token) {
		return axios({
			method: 'GET',
			url: dbInfo.url,
			responseType: 'arraybuffer',
			headers: {
				Authorization: 'Bearer ' + token
			}
		})
	}

	oauth.revokeAuth = function () {
		return chromePromise.runtime.getManifest().then(manifest => {
			let url = 'https://login.live.com/oauth20_logout.srf?client_id=' +
				manifest.static_data.onedrive.client_id
			return axios.get(url)
		})
	}

	oauth.handleAuthRedirectURI = function (redirect_url, randomState, resolve, reject) {

		function parseAuthInfoFromUrl(url) {
			var hash = /#(.+)$/.exec(url);
			if (!hash) {
				return null;
			}
			hash = hash[1];
			return JSON.parse('{"' + hash.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) {
				return key === "" ? value : decodeURIComponent(value);
			});
		}

		var authInfo = parseAuthInfoFromUrl(redirect_url);
		if (authInfo === null) {
			reject('Failed to extract authentication information from redirect url');
		} else {
			settings.getSetAccessToken(accessTokenType, authInfo.access_token);
			resolve();
		}
	}

	return OauthManager(settings, oauth)
}

export {
	OneDriveFileManager
}