"use strict";

const axios = require('axios')
import {
	ChromePromiseApi
} from '$lib/chrome-api-promise.js'

const chromePromise = ChromePromiseApi()

function SharedUrlFileManager() {
	var exports = {
		key: 'shared-url',
		listDatabases: listDatabases,
		getDatabaseChoiceData: getDatabaseChoiceData,
		getChosenDatabaseFile: getChosenDatabaseFile,
		supportedFeatures: ['incognito', 'listDatabases'],
		title: 'Shared Link',
		icon: 'icon-link',
		chooseTitle: 'Shared Link',
		chooseDescription: 'Rather than granting full access to your cloud storage provider, get a shared link and paste it in.  Any direct HTTP link will do, and Dropbox and Google Drive are supported.',
		addUrl: addUrl,
		removeUrl: removeUrl,
		getUrls: getUrls,
		login: enable,
		logout: disable,
		isLoggedIn: isEnabled
	};

	function enable() {
		return chromePromise.storage.local.set({
			'sharedUrlsEnabled': true
		})
	}

	function disable() {
		return chromePromise.storage.local.set({
			'sharedUrlsEnabled': false
		})
	}

	function isEnabled() {
		return chromePromise.storage.local.get('sharedUrlsEnabled').then(result => {
			return result.sharedUrlsEnabled || false
		})
	}

	function listDatabases() {
		return isEnabled().then(enabled => {
			if (enabled)
				return getUrls().then(urls => {
					if (urls)
						return urls
					return []
				})
			else
				return Promise.resolve([])
		})
	}

	//get the minimum information needed to identify this file for future retrieval
	function getDatabaseChoiceData(dbInfo) {
		return {
			direct_link: dbInfo.direct_link,
			title: dbInfo.title
		}
	}

	//given minimal file information, retrieve the actual file
	function getChosenDatabaseFile(dbInfo, attempt) {
		return axios({
			method: 'GET',
			url: dbInfo.direct_link,
			responseType: 'arraybuffer',
			cache: true
		}).then(function (response) {
			return response.data;
		});
	}

	function addUrl(url) {
		return this.getUrls().then(urls => {
			let index = urls.findIndex(oldUrl => url.title === oldUrl.title);
			if (index !== -1) {
				urls[index] = url;
			} else {
				urls.push(url);
			}

			return chromePromise.storage.local.set({
				'sharedUrlList': urls
			});
		});
	}

	function removeUrl(url) {
		return this.getUrls().then(urls => {
			let index = urls.findIndex(oldUrl => url.title === oldUrl.title);
			if (index !== -1) {
				urls.splice(index, 1);
			}

			if (urls) {
				return chromePromise.storage.local.set({
					'sharedUrlList': urls
				});
			} else {
				return chromePromise.storage.local.remove('sharedUrlList');
			}
		});
	}

	function getUrls() {
		return chromePromise.storage.local.get('sharedUrlList').then(results => {
			if (results.hasOwnProperty('sharedUrlList'))
				return results.sharedUrlList;
			return [];
		});
	}

	return exports;
}

export {
	SharedUrlFileManager
}
