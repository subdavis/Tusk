const kdbxweb = require('kdbxweb')

function KeepassReference() {
	"use strict";

	var my = {
		majorVersion: 3 // Defaults to 3, unless told otherwise
	};

	my.hasReferences = function (fieldValue) {
		return !!/\{.+\}/.test(fieldValue || '');
	}

	/*
	 * Process all references found in fieldValue to their final values
	 */
	my.processAllReferences = function (majorVersion, fieldValue, currentEntry, allEntries) {
		my.majorVersion = majorVersion; //update the major version if it changed.
		var re = /(\{[^\{\}]+\})/g;
		var expressions = re.exec(fieldValue || '');
		if (!expressions) return fieldValue; //no references

		var result = '',
			lastIndex = 0;
		while (expressions) {
			if (expressions.index >= lastIndex) {
				result += fieldValue.substring(lastIndex, expressions.index);
			}
			result += my.resolveReference(expressions[1], currentEntry, allEntries);
			lastIndex = expressions.index + expressions[1].length;
			expressions = re.exec(fieldValue || '');
		}

		if (lastIndex < fieldValue.length) {
			result += fieldValue.substring(lastIndex, fieldValue.length);
		}
		return result;
	}

	my.keewebGetDecryptedFieldValue = function (entry, fieldName) {
		if (entry.protectedData === undefined || !(fieldName in entry['protectedData'])) {
			return entry[fieldName] || ""; //not an encrypted field
		}
		return new kdbxweb.ProtectedValue(
			entry['protectedData'][fieldName].value,
			entry['protectedData'][fieldName].salt).getText();
	}

	my.getFieldValue = function (currentEntry, fieldName, allEntries) {
		// entries are JSON serializable.
		// Convert back to a keeweb.ProtectedValue for parsing.
		let plainText = my.keewebGetDecryptedFieldValue(currentEntry, fieldName);
		return my.processAllReferences(my.majorVersion, plainText, currentEntry, allEntries);
	}

	my.resolveReference = function (referenceText, currentEntry, allEntries) {
		var localParts = /^\{([a-zA-Z]+)\}$/.exec(referenceText)
		if (localParts) {
			// local field
			switch (localParts[1].toUpperCase()) {
				case 'TITLE':
					return currentEntry.title;
				case 'USERNAME':
					return currentEntry.userName;
				case 'URL':
					return currentEntry.url;
				case 'NOTES':
					return currentEntry.notes;
				case 'PASSWORD':
					return currentEntry.password;
			}
		}

		// https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
		let camelize = (str) => {
			return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
				return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
			}).replace(/\s+/g, '');
		}

		var customLocalString = /^\{S:([a-zA-Z]+)\}$/.exec(referenceText)
		if (customLocalString) {
			var camelCase = camelize(customLocalString[1])
			return currentEntry[camelCase];
		}

		var refString = /^\{REF:(T|U|P|A|N|I)@(T|U|P|A|N|I|O):(.+)\}$/.exec(referenceText);
		if (refString) {
			var wantedField = getPropertyNameFromCode(refString[1]);
			var searchIn = getPropertyNameFromCode(refString[2]);
			var text = refString[3];

			var matches = allEntries.filter(function (e) {
				if (searchIn === '*') {
					var customFieldMatches = e.keys.filter(function (key) {
						return String(e[key] || '').indexOf(text) !== -1;
					});
					return customFieldMatches.length > 0;
				} else if (searchIn === 'id') {
					return String(e[searchIn]).toLowerCase() === text.toLowerCase();
				} else {
					return String(e[searchIn] || '').indexOf(text) !== -1;
				}
			});
			if (matches.length) {
				if (my.majorVersion >= 3) {
					return my.keewebGetDecryptedFieldValue(matches[0], wantedField);
				} else {
					throw "Database Version Not Supported";
				}
			}
		}

		return referenceText;
	}

	function getPropertyNameFromCode(code) {
		switch (code) {
			case 'T':
				return 'title';
			case 'U':
				return 'userName';
			case 'P':
				return 'password';
			case 'A':
				return 'url';
			case 'N':
				return 'notes';
			case 'I':
				return 'id';
			case 'O':
				return '*';
		}

		return '';
	}

	return my;
}

export {
	KeepassReference
}