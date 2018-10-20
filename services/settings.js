const Base64 = require('base64-arraybuffer')
import { ChromePromiseApi } from '$lib/chrome-api-promise.js'
import { Links } from '$services/links.js'
const chromePromise = ChromePromiseApi()
const links = new Links()

function Settings(secureCache) {
	"use strict";

	var exports = {}

	/* factor to event bus */
	exports.handleProviderError = function (err, provider) {
		exports.getCurrentDatabaseChoice().then(info => {
			let providerKey = provider === undefined ? info.providerKey : provider.key;
			let errmsg = err.message || ""
			if (errmsg.indexOf('interact') >= 0) {
				/* There was an error with reauthorizing google drive... */
				links.openOptionsReauth(providerKey)
			}
		})
	}

	exports.getCurrentMasterPasswordCacheKey = function () {
		return exports.getCurrentDatabaseChoice().then(info => {
			if (info !== null)
				return info.passwordFile.title + "__" + info.providerKey + ".password"
			return null;
		});
	}

	exports.cacheMasterPassword = function (pw, args) {
		return exports.getCurrentMasterPasswordCacheKey().then(key => {
			return secureCache.save(key, pw).then(nil => {
				let forgetTime = args['forgetTime']
				return exports.setForgetTime(key, forgetTime)
			})
		})
	}

	/**
	 * Saves information about how the database was opened, so we can optimize the
	 * UI next time by hiding the irrelevant options and remembering the keyfile
	 */
	exports.saveCurrentDatabaseUsage = function (usage) {
		return exports.getCurrentDatabaseChoice().then(function (info) {
			return exports.getSetDatabaseUsages().then(function (usages) {
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
	exports.getCurrentDatabaseUsage = function () {
		return exports.getCurrentDatabaseChoice().then(function (info) {
			return exports.getSetDatabaseUsages().then(function (usages) {
				var key = info.passwordFile.title + "__" + info.providerKey;
				var usage = usages[key] || {};

				return secureCache.get(key + ".password").then(value => {
					usage['passwordKey'] = value;
					return usage
				})
			});
		})
	}

	exports.getSharedUrlList = function () {
		return chromePromise.storage.local.get('sharedUrlList').then(links => {
			return links || false;
		})
	}

	let keyGetSetter = function (key, val, defaultval, value_type) {
		let update_obj = {}
		update_obj[key] = val
		if (val !== undefined && (typeof (val) === value_type || val === null))
			return chromePromise.storage.local.set(update_obj).then(() => val)
		else
			return chromePromise.storage.local.get(key).then(oldval => {
				if (oldval[key] !== undefined)
					if (typeof (oldval[key]) === value_type)
						return oldval[key]
				return defaultval
			})
	}

	exports.getSetClipboardExpireInterval = function (interval) {
		return keyGetSetter('expireInterval', interval, 2, 'number')
	}

	exports.getSetAccessToken = function (type, accessToken) {
		return keyGetSetter(type + 'AccessToken', accessToken, null, 'string')
	}

	exports.getSetDatabaseUsages = function (usages) {
		return keyGetSetter('databaseUsages', usages, {}, 'object')
	}

	exports.getSetDefaultRememberPeriod = function (rememberPeriod) {
		return keyGetSetter('rememberPeriod', rememberPeriod, 0, 'number')
	}

	exports.getSetWebdavServerList = function (serverList) {
		return keyGetSetter('webdavServerList', serverList, [], 'object')
	}

	exports.getSetWebdavDirectoryMap = function (dirMap) {
		return keyGetSetter('webdavDirectoryMap', dirMap, {}, 'object')
	}

	exports.getSetHotkeyNavEnabled = function (enabled) {
		return keyGetSetter('hotkeyNavEnabled', enabled, false, 'boolean')
	}

	exports.getSetStrictModeEnabled = function (enabled) {
		return keyGetSetter('strictMatchModeEnabled', enabled, false, 'boolean')
	}

	exports.getSetNotificationsEnabled = function (enabledTypes) {
		return keyGetSetter('notificationsEnabled', enabledTypes, ['clipboard', 'expiration'], 'object')
	}

	exports.getSetOriginPermissionEnabled = function (enabled) {
		return keyGetSetter('originPermissionsEnabled', enabled, false, 'boolean')
	}

	return exports
}

export {
	Settings
}
