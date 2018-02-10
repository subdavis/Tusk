const Base64 = require('base64-arraybuffer')
const lambda = require('$lib/lambda-keystore.js')

import { ChromePromiseApi } from '$lib/chrome-api-promise.js'
import { Links } from '$services/links.js'
import { Offloader } from '$lib/offloader.js'
const chromePromise = ChromePromiseApi()
const links = new Links()

/**
 * Settings for Tusk  */
function Settings(secureCache) {
	"use strict";
	
	var exports = {}
	var offloader = new Offloader(exports, lambda)

	//upgrade old settings.  Called on install.
	exports.upgrade = function() {
		// Patch https://subdavis.com/blog/jekyll/update/2017/01/02/ckp-security-flaw.html
		exports.getSetDatabaseUsages().then(usages => {
			let keys = Object.keys(usages)
			keys.forEach(k => {
				if (usages[k]['passwordKey'] !== undefined)
					chrome.storage.local.clear()
			})
		})
	}

	exports.handleProviderError = function(err, provider) {
		exports.getCurrentDatabaseChoice().then(info => {
			let providerKey = provider === undefined ? info.providerKey : provider.key;
			let errmsg = err.message || ""
			if (errmsg.indexOf('interact') >= 0) {
				/* There was an error with reauthorizing google drive... */
				links.openOptionsReauth(providerKey)
			}
		})
	}

	exports.getKeyFiles = function() {
		return chromePromise.storage.local.get(['keyFiles']).then(function(items) {
			return items.keyFiles || [];
		});
	}

	exports.deleteKeyFile = function(name) {
		return exports.getKeyFiles().then(function(keyFiles) {
			keyFiles.forEach(function(keyFile, index) {
				if (keyFile.name === name) {
					keyFiles.splice(index, 1);
				}
			})

			return chromePromise.storage.local.set({
				'keyFiles': keyFiles
			});
		});
	}

	exports.deleteAllKeyFiles = function() {
		return chromePromise.storage.local.remove('keyFiles')
	}

	exports.destroyLocalStorage = function(key) {
		if (key.length) {
			return chromePromise.storage.local.remove(key)
		}
	}

	exports.addKeyFile = function(name, key) {
		return exports.getKeyFiles().then(function(keyFiles) {
			var matches = keyFiles.filter(function(keyFile) {
				return keyFile.name === name;
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

	exports.saveCurrentDatabaseChoice = function(passwordFile, provider) {
		let shallowCopy = function(obj) {
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

	exports.disableDatabaseProvider = function(provider) {
		return chromePromise.storage.local.get(['selectedDatabase']).then(items => {
			if (items.selectedDatabase)
				if (items.selectedDatabase.providerKey === provider.key)
					return chromePromise.storage.local.remove('selectedDatabase')
			return Promise.resolve(false)
		})
	}

	exports.getCurrentMasterPasswordCacheKey = function() {
		return exports.getCurrentDatabaseChoice().then(info => {
			if (info !== null)
				return info.passwordFile.title + "__" + info.providerKey + ".password"
			return null;
		});
	}

	exports.cacheMasterPassword = function(pw, args) {
		/* May involve a network call */
		let currentMasterPasswordCacheKeyPromise = exports.getCurrentMasterPasswordCacheKey()
		let localOffloadEnabledPromise = exports.getSetLocalKeyOffload()
		return Promise.all([currentMasterPasswordCacheKeyPromise, localOffloadEnabledPromise]).then(values => {
			let currentMasterPasswordCacheKey = values[0];
			let localOffloadEnabled = values[1];
			let valueToCachePromise = null;
			if (localOffloadEnabled) {
				valueToCachePromise = offloader.encrypt(currentMasterPasswordCacheKey, pw, args['forgetTime'])
			} else {
				valueToCachePromise = Promise.resolve(pw);
			}
			return valueToCachePromise.then(valueToCache => {
				return secureCache.save(currentMasterPasswordCacheKey, valueToCache).then(nil => {
					let forgetTime = args['forgetTime']
					return exports.setForgetTime(currentMasterPasswordCacheKey, forgetTime)
				})
			})
		})
	}

	exports.getCachedMasterPassword = function() {
		/* Based on the user configuration, this may involve a network call
		   if offload enabled, get the key from AWS 
		   else simply store it in background page memory.
		 */
		let currentMasterPasswordCacheKeyPromise = exports.getCurrentMasterPasswordCacheKey()
		let localOffloadEnabledPromise = exports.getSetLocalKeyOffload()
		return Promise.all([currentMasterPasswordCacheKeyPromise, localOffloadEnabledPromise]).then(values => {
			let currentMasterPasswordCacheKey = values[0];
			let localOffloadEnabled = values[1];
			let valueToReturnPromise = null;
			if (localOffloadEnabled) {
				valueToReturnPromise = offloader.decrypt(currentMasterPasswordCacheKey)
			} else {
				valueToReturnPromise = secureCache.get(currentMasterPasswordCacheKey)
			}
			return valueToReturnPromise;
		});
	}

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
			// only set if not exists...  This prevents us from resetting the clock every unlock...
			if (!(key in forgetTimes))
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
			return exports.getSetDatabaseUsages().then(function(usages) {
				var key = info.passwordFile.title + "__" + info.providerKey;
				usages[key] = usage;

				return exports.getSetDatabaseUsages(usages);
			});
		});
	}

	/**
	 * Retrieves information about how the database was opened, so we can optimize the
	 * UI by hiding the irrelevant options and remembering the keyfile
	 */
	exports.getCurrentDatabaseUsage = function() {
		return exports.getCurrentDatabaseChoice().then(function(info) {
			return exports.getSetDatabaseUsages().then(function(usages) {
				var key = info.passwordFile.title + "__" + info.providerKey;
				var usage = usages[key] || {};
				return usage;
			});
		})
	}

	exports.getSharedUrlList = function() {
		return chromePromise.storage.local.get('sharedUrlList').then(links => {
			return links || false;
		})
	}

	let keyGetSetter = function(key, val, defaultval, value_type) {
		let update_obj = {}
		update_obj[key] = val
		if (val !== undefined && (typeof(val) === value_type || val === null) )
			return chromePromise.storage.local.set(update_obj).then(nil => {
				return val
			})
		else
			return chromePromise.storage.local.get(key).then(oldval => {
				if (oldval[key] !== undefined)
					if (typeof(oldval[key]) === value_type)
						return oldval[key]
				return defaultval
			})
	}

	exports.getSetClipboardExpireInterval = function(interval) {
		return keyGetSetter('expireInterval', interval, 2, 'number')
	}

	exports.getSetAccessToken = function(type, accessToken) {
		let key = type + 'AccessToken';
		return keyGetSetter(key, accessToken, null, 'string')
	}

	exports.getSetDatabaseUsages = function(usages) {
		return keyGetSetter('databaseUsages', usages, {}, 'object')
	}

	exports.getSetDefaultRememberPeriod = function(rememberPeriod) {
		return keyGetSetter('rememberPeriod', rememberPeriod, 0, 'number')
	}

	exports.getSetOffloaderToken = function(offloaderToken) {
		return keyGetSetter('offloaderToken', offloaderToken, null, 'string')
	}
	
	exports.getSetLocalKeyOffload = function(enabled) {
		return keyGetSetter('offloadEnabled', enabled, false, 'boolean')
	}

	return exports;
}

export {
	Settings
}