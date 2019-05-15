"use strict";
/**
 * Service for opening keepass files
 */
let Case = require('case'),
	Base64 = require('base64-arraybuffer'),
	pako = require('pako'),
	kdbxweb = require('kdbxweb')

import { argon2 } from '$lib/argon2.js'
import { parseUrl, getValidTokens } from '$lib/utils.js'

function KeepassService(keepassHeader, settings, passwordFileStoreRegistry, keepassReference) {
	var my = {};

	var littleEndian = (function () {
		var buffer = new ArrayBuffer(2);
		new DataView(buffer).setInt16(0, 256, true);
		return new Int16Array(buffer)[0] === 256;
	})();

	/** 
	 * return Promise(arrayBufer)
	 */
	my.getChosenDatabaseFile = function () {
		return passwordFileStoreRegistry.getChosenDatabaseFile(settings)
	}

	my.getMasterKey = function (bufferPromise, masterPassword, keyFileInfo) {
		/**
		 * Validate that one of the following is true:
		 * (password isn't empty OR keyfile isn't empty)
		 * ELSE
		 * (assume password is the empty string)
		 */
		let protectedMasterPassword;
		if (masterPassword === undefined && keyFileInfo === undefined) {
			// Neither keyfile nor password provided.  Assume empty string password.
			protectedMasterPassword = kdbxweb.ProtectedValue.fromString("");
		} else if (masterPassword === "" && keyFileInfo !== undefined) {
			// Keyfile but empty password provided.  Assume password is unused.
			// This extension does not support the combo empty string + keyfile.
			protectedMasterPassword = null;
		} else {
			protectedMasterPassword = kdbxweb.ProtectedValue.fromString(masterPassword)
		}
		var fileKey = keyFileInfo ? Base64.decode(keyFileInfo.encodedKey) : null;
		return bufferPromise.then(function (buf) {
			var h = keepassHeader.readHeader(buf);
			return getKey(h.kdbx, protectedMasterPassword, fileKey);
		});
	}

	my.getDecryptedData = function (bufferPromise, masterKey) {
		var majorVersion;
		return bufferPromise.then(function (buf) {
			var h = keepassHeader.readHeader(buf);
			if (!h) throw new Error('Failed to read file header');

			if (h.kdbx) { // KDBX - use kdbxweb library
				kdbxweb.CryptoEngine.argon2 = argon2;
				var kdbxCreds = jsonCredentialsToKdbx(masterKey);
				return kdbxweb.Kdbx.load(buf, kdbxCreds).then(db => {
					var psk = new Uint8Array(db.header.protectedStreamKey, 0, db.header.protectedStreamKey.length);
					var entries = parseKdbxDb(db.groups);
					majorVersion = db.header.versionMajor;
					return processReferences(entries, majorVersion);
				});
			} else { // KDB - we don't support this anymore
				throw "Unsupported Database Version";
			}
		}).then(function (entries) {
			return {
				entries: entries,
				version: majorVersion
			};
		});
	}

	my.rankEntries = (entries, siteUrl, title, siteTokens) => {
		entries.forEach(function (entry) {
			//apply a ranking algorithm to find the best matches
			var entryOrigins = [parseUrl(entry.url)]

			if (entry.keys.indexOf('tuskUrls') >= 0) {
				let others = entry.tuskUrls
					.split(',')
					.map(val => {
						return parseUrl(val)
					})
				entryOrigins = entryOrigins.concat(others)
			}
			if (entryOrigins.length && entryOrigins.some(a => a && (a.origin == siteUrl.origin)))
				entry.matchRank = 100 // perfect match
			else if (entryOrigins.length && entryOrigins.some(a => a && (a.host == siteUrl.host)))
				entry.matchRank = 10  // possible match
			else if (entryOrigins.length && entryOrigins.some(a => a && (a.hostname == siteUrl.hostname)))
				entry.matchRank = -100 // phishing?
			else
				entry.matchRank = 0 // None

			entry.matchRank += (entry.title && title && entry.title.toLowerCase() == title.toLowerCase()) ? 1 : 0
			entry.matchRank += (entry.title && entry.title.toLowerCase() === siteUrl.hostname.toLowerCase()) ? 1 : 0
			entry.matchRank += (entry.url && siteUrl.hostname.indexOf(entry.url.toLowerCase()) > -1) ? 0.9 : 0
			entry.matchRank += (entry.title && siteUrl.hostname.indexOf(entry.title.toLowerCase()) > -1) ? 0.9 : 0

			var entryTokens = getValidTokens(entryOrigins.join('.') + "." + entry.title);
			for (var i = 0; i < entryTokens.length; i++) {
				var token1 = entryTokens[i]
				for (var j = 0; j < siteTokens.length; j++) {
					var token2 = siteTokens[j]
					if (token1 == token2) {
						entry.matchRank += 0.2;
					}

				}
			}
		})
	}

	function getKey(isKdbx, protectedMasterPassword, fileKey) {
		var creds = new kdbxweb.Credentials(protectedMasterPassword, fileKey);
		return creds.ready.then(() => {
			return kdbxCredentialsToJson(creds);
		});
	}

	function processReferences(entries, majorVersion) {
		// In order to fully implement references, majorVersion will need to be known
		// as there are more capabilities for references in v2+
		entries.forEach(function (entry) {
			if (entry.keys) {
				entry.keys.forEach(function (key) {
					var fieldRefs = keepassReference.hasReferences(entry[key]);
					if (fieldRefs) {
						let value = keepassReference.processAllReferences(majorVersion, entry[key], entry, entries);
						if (['password', 'otp'].indexOf(key) >= 0) {
							let newProtectedVal = kdbxweb.ProtectedValue.fromString(value);
							entry.protectedData[Case.camel(key)] = protectedValueToJSON(newProtectedVal);
							delete entry[key];
						} else {
							entry[key] = value;
						}
					}
				});
			}
		});
		return entries;
	}

	/*
	 * Takes a kdbxweb group object and transforms it into a list of entries.
	 **/
	function parseKdbxDb(groups) {
		var results = [];
		for (var i = 0; i < groups.length; i++) {
			var group = groups[i]
			if (group.groups.length > 0) {
				// recursive case for subgroups.
				results = results.concat(parseKdbxDb(group.groups));
			}
			for (var j = 0; j < group.entries.length; j++) {
				var db_entry = group.entries[j];
				var entry = {
					protectedData: {},
					keys: []
				};
				// Entry properties defined by the parent group
				entry.searchable = true;
				if (group.enableSearching === false)
					entry.searchable = false;
				entry.groupIconId = group.icon;
				entry.keys.push("groupName");
				entry.groupName = group.name;
				if (entry.searchable)
					results.push(entry);
				// Entry properties defined by the entry
				if (db_entry.uuid) {
					if (db_entry.uuid.empty == false)
						entry.id = convertArrayToUUID(Base64.decode(db_entry.uuid.id));
				}
				if (db_entry.icon)
					entry.iconId = db_entry.icon;
				if (db_entry.tags.length > 0) { //verify
					var tagstring = ""
					for (let k = 0; k < db_entry.tags.length; k++) {
						tagstring += db_entry.tags[k] + ","
					}
					entry.tags = tagstring;
					entry.keys.push('tags');
				}
				if (db_entry.fields) {
					var field_keys = Object.keys(db_entry.fields);
					for (let k = 0; k < field_keys.length; k++) {
						var field = field_keys[k];
						if (typeof db_entry.fields[field] === 'object') {
							// type = object ? protected value
							entry.protectedData[Case.camel(field)] = protectedValueToJSON(db_entry.fields[field]);
						} else {
							entry.keys.push(Case.camel(field));
							entry[Case.camel(field)] = db_entry.fields[field];
						}
					}
				}
				if (db_entry.times) {
					if (db_entry.times.expires) {
						let expiry_date = Date.parse(db_entry.times.expiryTime);
						entry.expiry = db_entry.times.expiryTime.toString();
						entry.is_expired = (Date.now() - expiry_date) > 0 // Both measured in milliseconds
						entry.keys.push("expiry");
					}
				}
			}
		}
		return results;
	}

	function convertArrayToUUID(arr) {
		var int8Arr = new Uint8Array(arr);
		var result = new Array(int8Arr.byteLength * 2);
		for (var i = 0; i < int8Arr.byteLength; i++) {
			var hexit = int8Arr[i].toString(16).toUpperCase();
			result[i * 2] = hexit.length == 2 ? hexit : "0" + hexit;
		}
		return result.join("");
	}

	/*
	 * The following 3 methods are utilities for the KeeWeb protectedValue class.
	 * Because it uses uint8 arrays that are not JSON serializable, we must transform them
	 * in and out of JSON serializable formats for use.
	 */

	function protectedValueToJSON(pv) {
		return {
			salt: Array.from(pv._salt),
			value: Array.from(pv._value)
		}
	}

	function kdbxCredentialsToJson(creds) {
		var jsonRet = {
			passwordHash: null,
			keyFileHash: null
		};
		for (var key in jsonRet)
			if (creds[key])
				jsonRet[key] = protectedValueToJSON(creds[key]);
		return jsonRet;
	}

	function jsonCredentialsToKdbx(jsonCreds) {
		var creds = new kdbxweb.Credentials(null, null);
		for (var key in jsonCreds)
			if (jsonCreds[key])
				creds[key] = new kdbxweb.ProtectedValue(jsonCreds[key].value, jsonCreds[key].salt);
		return creds;
	}

	return my;
}

export {
	KeepassService
}
