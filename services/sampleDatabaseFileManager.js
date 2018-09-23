"use strict";

const axios = require('axios')
import {
	ChromePromiseApi
} from '$lib/chrome-api-promise.js'

const chromePromise = ChromePromiseApi()

function SampleDatabaseFileManager() {
	var exports = {
		key: 'sample',
		listDatabases: listDatabases,
		getDatabaseChoiceData: getDatabaseChoiceData,
		getChosenDatabaseFile: getChosenDatabaseFile,
		supportedFeatures: ['incognito', 'listDatabases'],
		title: 'Sample',
		permissions: [],
		icon: 'icon-flask',
		chooseTitle: 'Sample Database',
		chooseDescription: 'Sample database that you can use to try out the functionality.  The master password is 123.',
		getActive: getActive,
		setActive: setActive,
		login: login, // Implement the "oauth" interface
		logout: logout, // implement the "oauth" interface
		isLoggedIn: getActive
	};

	function login() {
		return setActive(true)
	}

	function logout() {
		return setActive(false)
	}

	function listDatabases() {
		return getActive().then(function (flag) {
			if (flag) {
				return [{
					title: 'Sample.kdbx - password is 123'
				}];
			} else {
				return [];
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
		return axios({
			method: 'GET',
			url: chrome.extension.getURL('/assets/other/Sample123.kdbx'),
			responseType: 'arraybuffer'
		}).then(function (response) {
			return response.data;
		});
	}

	function setActive(flag) {
		if (flag)
			return chromePromise.storage.local.set({
				'useSampleDatabase': true
			});
		else
			return chromePromise.storage.local.remove('useSampleDatabase');
	}

	function getActive() {
		return chromePromise.storage.local.get('useSampleDatabase').then(function (results) {
			return !!results.useSampleDatabase;
		});
	}

	return exports;
}

export {
	SampleDatabaseFileManager
}