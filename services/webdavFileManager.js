const webdav = require('webdav');
const Base64 = require('base64-arraybuffer');
import { ChromePromiseApi } from '$lib/chrome-api-promise.js'

const chromePromise = ChromePromiseApi()

function WebdavFileManager() {
	var exports = {
		key: 'webdav',
		listDatabases: listDatabases,
		getDatabaseChoiceData: getDatabaseChoiceData,
		getChosenDatabaseFile: getChosenDatabaseFile,
		deleteDatabase: deleteDatabase,
		supportedFeatures: ['ingognito', 'listDatabases', 'deleteDatabase'],
		title: 'WebDAV',
		icon: 'icon-upload',
		chooseTitle: 'WebDAV'
		chooseDescription: 'Choose a database from any WebDAV file server.  Tusk will always keep your database in sync with the server and automatically pull new versions.  WARNING: If you require username/password to use webdav, this will store them unencrypted on disk.',
		login: enable,
		logout: disable,
		isLoggedIn: isEnabled
	};

	function enable() {
		return chromePromise.storage.local.set({
			'webdavEnabled': true
		})
	}

	function disable() {
		return chromePromise.storage.local.set({
			'webdavEnabled': false
		})
	}

	function isEnabled() {
		return chromePromise.storage.local.get('webdavEnabled').then(result => {
			return result.webdavEnabled || false
		})
	}

	function listDatabases() {

	}

	//get the minimum information needed to identify this file for future retrieval
	function getDatabaseChoiceData(dbInfo) {
		return {
			title: dbInfo.title
		}
	}

	//given minimal file information, retrieve the actual file
	function getChosenDatabaseFile(dbInfo) {
		return listDatabases().then(function(databases) {
			var bytes = databases.reduce(function(prev, storedFile) {
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
	function addServer(db) {
		db.storageVersion = currentVersion;
		var p = listDatabases().then(function(existingFiles) {
			var index = existingFiles.reduce(function(prev, curr, index) {
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
	function removeServer(db) {
		return listDatabases().then(function(databases) {
			databases = databases.filter(function(existing) {
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
	WebdavFileManager
}