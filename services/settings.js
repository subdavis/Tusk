let Base64 = require('base64-arraybuffer')
import { ChromePromiseApi } from '$lib/chrome-api-promise.js'

const chromePromise = ChromePromiseApi()
/**
 * Settings for CKPX  */
function Settings() {
	"use strict";

	var exports = {}

	//upgrade old settings.  Called on install.
	exports.upgrade = function() {
		//Upgrade is not backward compatible.  Wipe usage.
		exports.getDatabaseUsages().then(function(usages) {
			for (let usageKey in usages) {
				let usage = usages[usageKey]
				usages[usageKey] = {
					// do data translations...
					passwordKey: usage.passwordKey,
					requiresKeyfile: usage.requiresKeyFile,
					requiresPassword: usage.requiresPassword,
					version: usage.version,
					keyFileName: usage.keyFileName
				};
			}
			// exports.saveDatabaseUsages(usages);
		});
	}

	exports.getKeyFiles = function() {
		return chromePromise.storage.local.get(['keyFiles']).then(function(items) {
			return items.keyFiles || [];
		});
	}

	exports.deleteKeyFile = function(name) {
		return exports.getKeyFiles().then(function(keyFiles) {
			keyFiles.forEach(function(keyFile, index) {
				if (keyFile.name == name) {
					keyFiles.splice(index, 1);
				}
			})

			return chromePromise.storage.local.set({
				'keyFiles': keyFiles
			});
		});
	}

	exports.deleteAllKeyFiles = function () {
		return chromePromise.storage.local.remove('keyFiles')
	}

	exports.destroyLocalStorage = function (key) {
		if (key.length) {
			return chromePromise.storage.local.remove(key)
		}
	}

	exports.addKeyFile = function(name, key) {
		return exports.getKeyFiles().then(function(keyFiles) {
			var matches = keyFiles.filter(function(keyFile) {
				return keyFile.name == name;
			})

			var encodedKey = Base64.encode(key);
			if (matches.length) {
				//update
				matches[0].encodedKey = encodedKey;
			} else {
				//insert
				keyFiles.push({
					name: name,
					encodedKey: encodedKey
				})
			}

			return chromePromise.storage.local.set({
				'keyFiles': keyFiles
			});
		});
	}

	exports.setDiskCacheFlag = function(val) {
		return chromePromise.storage.local.set({
			'useDiskCache': val
		});
	}

	exports.getDiskCacheFlag = function() {
		return chromePromise.storage.local.get('useDiskCache').then(function(items) {
			return items.useDiskCache;
		});
	}

	exports.saveDatabaseUsages = function(usages) {
		return chromePromise.storage.local.set({
			'databaseUsages': usages
		});
	}

	exports.getDatabaseUsages = function() {
		return chromePromise.storage.local.get(['databaseUsages']).then(function(items) {
			items.databaseUsages = items.databaseUsages || {};
			return items.databaseUsages;
		});
	}

	exports.saveCurrentDatabaseChoice = function(passwordFile, provider) {
		let shallowCopy = function (obj) { 
			let clone = {}
		  clone.prototype = obj.prototype
		  Object.keys(obj).forEach(property => {
		  	clone[property] = obj[property];
		  })
		  return clone
		}
		let passwordFileClone = shallowCopy(passwordFile)
		passwordFileClone.data = undefined; //don't save the data with the choice

		return chromePromise.storage.local.set({
			'selectedDatabase': {
				'passwordFile': passwordFileClone,
				'providerKey': provider.key
			}
		});
	}

	exports.getCurrentDatabaseChoice = function() {
		return chromePromise.storage.local.get(['selectedDatabase']).then(function(items) {
			if (items.selectedDatabase) {
				return items.selectedDatabase;
			} else {
				return null;
			}
		});
	}

	exports.saveDefaultRememberOptions = function(rememberPeriod) {
		if (rememberPeriod !== 0) {
			return chromePromise.storage.local.set({
				'rememberPeriod': rememberPeriod
			})
		}

		// clear options
		return chromePromise.storage.local.remove('rememberPeriod')
	}

	exports.getDefaultRememberOptions = function() {
		return chromePromise.storage.local.get('rememberPeriod').then( items => {
			if (items.rememberPeriod) {
				return {
					rememberPassword: true,
					rememberPeriod: items.rememberPeriod
				}
			} else {
				return {
					rememberPassword: false,
					rememberPeriod: 0
				}
			}
		})
	}

	exports.saveLicense = function(license) {
		return chromePromise.storage.local.set({
			'license': license
		});
	}

	exports.getLicense = function() {
		return chromePromise.storage.local.get(['license']).then(function(items) {
			if (items.license)
				return items.license;
			else
				return null;
		})
	}

	exports.saveAccessToken = function(type, accessToken) {
		var entries = {};
		entries[type + 'AccessToken'] = accessToken;

		return chromePromise.storage.local.set(entries);
	};

	exports.getAccessToken = function(type) {
		var key = type + 'AccessToken';
		return chromePromise.storage.local.get([key]).then(function(items) {
			if (items[key])
				return items[key];
			else
				return null;
		});
	};

	/*
	 * Sets a time to forget something
	 */
	exports.setForgetTime = function(key, time) {
		var storageKey = 'forgetTimes';
		return chromePromise.storage.local.get(storageKey).then(function(items) {
			var forgetTimes = {}
			if (items[storageKey]) {
				forgetTimes = items[storageKey];
			}
			forgetTimes[key] = time;

			return chromePromise.storage.local.set({
				'forgetTimes': forgetTimes
			});
		});
	}

	exports.getForgetTime = function(key) {
		var storageKey = 'forgetTimes';
		return chromePromise.storage.local.get(storageKey).then(function(items) {
			var forgetTimes = {}
			if (items[storageKey]) {
				forgetTimes = items[storageKey];
			}

			return forgetTimes[key];
		});
	}

	exports.getAllForgetTimes = function() {
		var storageKey = 'forgetTimes';
		return chromePromise.storage.local.get(storageKey).then(function(items) {
			var forgetTimes = {}
			if (items[storageKey]) {
				forgetTimes = items[storageKey];
			}

			return forgetTimes;
		})
	}

	exports.clearForgetTimes = function(keysArray) {
		var storageKey = 'forgetTimes';
		return chromePromise.storage.local.get(storageKey).then(function(items) {
			var forgetTimes = {}
			if (items[storageKey]) {
				forgetTimes = items[storageKey];
			}
			keysArray.forEach(function(key) {
				if (forgetTimes[key]) 
					delete forgetTimes[key];
			})

			return chromePromise.storage.local.set({
				'forgetTimes': forgetTimes
			});
		});
	}

	/**
	 * Saves information about how the database was opened, so we can optimize the
	 * UI next time by hiding the irrelevant options and remembering the keyfile
	 */
	exports.saveCurrentDatabaseUsage = function(usage) {
		return exports.getCurrentDatabaseChoice().then(function(info) {
			return exports.getDatabaseUsages().then(function(usages) {
				var key = info.passwordFile.title + "__" + info.providerKey;
				usages[key] = usage;

				return exports.saveDatabaseUsages(usages);
			});
		});
	}

	/**
	 * Retrieves information about how the database was opened, so we can optimize the
	 * UI by hiding the irrelevant options and remembering the keyfile
	 */
	exports.getCurrentDatabaseUsage = function() {
		return exports.getCurrentDatabaseChoice().then(function(info) {
			return exports.getDatabaseUsages().then(function(usages) {
				var key = info.passwordFile.title + "__" + info.providerKey;
				var usage = usages[key] || {};

				return usage;
			});
		})
	}

	exports.setUseCredentialApiFlag = function(flagValue) {
		if (flagValue) {
			return chromePromise.storage.local.set({
				'useCredentialApi': true
			})
		}

		return chromePromise.storage.local.remove('useCredentialApi');
	}

	exports.getUseCredentialApiFlag = function() {
		return chromePromise.storage.local.get('useCredentialApi').then( items => {
			return !!items.useCredentialApi;
		})
	}


	exports.setPasswordListIconOption = function(option) {
		return chromePromise.storage.local.set({
			'showPasswordListIcon': option
		})
	}

	exports.getPasswordListIconOption = function() {
		return chromePromise.storage.local.get('showPasswordListIcon').then(function(option) {
			let result = option.showPasswordListIcon || {};
			result.entry = result.entry || false;
			result.group = result.group || false;
			return result;
		})
	}

	exports.setPasswordListGroupOption = function(option) {
		return chromePromise.storage.local.set({
			'showPasswordListGroup': option
		})
	}

	exports.getPasswordListGroupOption = function() {
		return chromePromise.storage.local.get('showPasswordListGroup').then(function(option) {
			return option.showPasswordListGroup || false;
		})
	}

	return exports;
}

export { Settings }