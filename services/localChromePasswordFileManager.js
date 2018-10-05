"use strict";
const Base64 = require('base64-arraybuffer')
import {
	ChromePromiseApi
} from '$lib/chrome-api-promise.js'

const chromePromise = ChromePromiseApi()

function LocalChromePasswordFileManager() {
	var exports = {
		key: 'local',
		listDatabases: listDatabases,
		getDatabaseChoiceData: getDatabaseChoiceData,
		getChosenDatabaseFile: getChosenDatabaseFile,
		saveDatabase: saveDatabase,
		deleteDatabase: deleteDatabase,
		supportedFeatures: ['incognito', 'listDatabases', 'saveDatabase', 'deleteDatabase'],
		title: 'Local Storage',
		icon: 'icon-upload',
		chooseTitle: 'File System (not recommended)',
		chooseDescription: 'Upload files from your local or remote file-system.  A one-time copy of the file(s) will be saved in your browser\'s local storage.  If you update the database on your local system then you will have to re-import it in order to see the changes.',
		login: enable,
		logout: disable,
		isLoggedIn: isEnabled
	};

	var backwardCompatibleVersion = 1; //missing version or version less than this is ignored due missing info or bugs in old storage
	var currentVersion = 1; //current version

	function enable() {
		return chromePromise.storage.local.set({
			'localPasswordFilesEnabled': true
		})
	}

	function disable() {
		return chromePromise.storage.local.set({
			'localPasswordFilesEnabled': false
		})
	}

	function isEnabled() {
		return chromePromise.storage.local.get('localPasswordFilesEnabled').then(result => {
			return result.localPasswordFilesEnabled || false
		})
	}

	var savingLocks = []; //prevent reading while an async save is ongoing
	function listDatabases() {
		return Promise.all(savingLocks).then(function () {
			return chromePromise.storage.local.get('passwordFiles')
		}).then(function (result) {
			var files = result.passwordFiles || [];

			return files.filter(function (fi) {
				return (fi.storageVersion && fi.storageVersion >= backwardCompatibleVersion);
			});
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
		return listDatabases().then(function (databases) {
			var bytes = databases.reduce(function (prev, storedFile) {
				if (storedFile.title == dbInfo.title) {
					var data = Base64.decode(storedFile.data);
					return data;
				} else
					return prev;
			}, []);

			if (bytes && bytes.byteLength)
				return bytes;
			else
				throw new Error("Failed to find the requested file");
		});
	}

	//save the given database to persistent storage
	function saveDatabase(db) {
		db.storageVersion = currentVersion;
		var p = listDatabases().then(function (existingFiles) {
			var index = existingFiles.reduce(function (prev, curr, index) {
				if (curr.title == db.title)
					return index;
				else
					return prev;
			}, -1);

			if (index == -1) {
				existingFiles.push(db);
			} else {
				existingFiles[index] = db;
			}

			return chromePromise.storage.local.set({
				'passwordFiles': existingFiles
			});
		});

		savingLocks.push(p); //ensure that a future read has to wait for the write to complete
		return p;
	}

	//remove the database from storage
	function deleteDatabase(db) {
		return listDatabases().then(function (databases) {
			databases = databases.filter(function (existing) {
				return (existing.title != db.title);
			});

			if (databases.length)
				return chromePromise.storage.local.set({
					'passwordFiles': databases
				});
			else
				return chromePromise.storage.local.remove('passwordFiles');
		});
	}

	return exports;
}

export {
	LocalChromePasswordFileManager
}
