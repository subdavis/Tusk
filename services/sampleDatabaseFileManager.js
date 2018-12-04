"use strict";

const axios = require('axios')
import store from '@/store'
import {
	PROVIDER_ENABLE,
	PROVIDER_DISABLE,
	PROVIDER_ENABLED_GET,
} from '@/store/modules/settings'

function SampleDatabaseFileManager(settings) {
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
		const enabled = this.getActive();
		if (enabled) {
			return [{ title: 'Sample.kdbx - password is 123' }];
		} else {
			return [];
		}
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
			return Promise.resolve(store.commit(PROVIDER_ENABLE, { providerKey: exports.key }))
		else
			return Promise.resolve(store.commit(PROVIDER_DISABLE, { providerKey: exports.key }))
	}

	function getActive() {
		return store.getters[PROVIDER_ENABLED_GET](exports.key);
	}

	return exports;
}

export {
	SampleDatabaseFileManager
}