/**

The MIT License (MIT)

Copyright (c) 2015 Steven Campbell.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

 */

/**
 * Service for resolving keepass references
 */
function KeepassReference(streamCipher) {
	"use strict";

	var my = {
		majorVersion: 3 // Defaults to 2, unless told otherwise
	};

	my.hasReferences = function(fieldValue) {
		return !!/\{.+\}/.test(fieldValue || '');
	}

	/*
	 * Process all references found in fieldValue to their final values
	 */
	my.processAllReferences = function(majorVersion, fieldValue, currentEntry, allEntries) {
		my.majorVersion = majorVersion; //update the major version if it changed.
		var re = /(\{[^\{\}]+\})/g;
		var expressions = re.exec(fieldValue || '');
		if (!expressions) return fieldValue;  //no references
		
		var result = '', lastIndex = 0;
		while (expressions) {
			if (expressions.index >= lastIndex) {
				result += fieldValue.substring(lastIndex, expressions.index);
			}
			result += resolveReference(expressions[1], currentEntry, allEntries);
			lastIndex = expressions.index + expressions[1].length;
			expressions = re.exec(fieldValue || '');
		}

		if (lastIndex < fieldValue.length) {
			result += fieldValue.substring(lastIndex, fieldValue.length);
		}
		
		return result;
	}

	my.keewebGetDecryptedFieldValue = function(entry, fieldName){
		let keewebProtectedValue = new kdbxweb.ProtectedValue(
			entry['protectedData'][fieldName].value, 
			entry['protectedData'][fieldName].salt);
		return keewebProtectedValue.getText();
	}

	my.getFieldValue = function(currentEntry, fieldName, allEntries) {
		// entries are JSON serializable.
		// Convert back to a keeweb.ProtectedValue for parsing.
		let plainText = my.keewebGetDecryptedFieldValue(currentEntry, fieldName);
		return my.processAllReferences(plainText, currentEntry, allEntries);
	}

	function resolveReference(referenceText, currentEntry, allEntries) {
		var localParts = /^\{([a-zA-Z]+)\}$/.exec(referenceText)
		if (localParts) {
			// local field
			switch (localParts[1].toUpperCase()) {
				case 'TITLE': return currentEntry.title; 
				case 'USERNAME': return currentEntry.userName;
				case 'URL': return currentEntry.url;
				case 'NOTES': return currentEntry.notes;
				case 'PASSWORD': return currentEntry.password;
			}
		}

		var customLocalString = /^\{S:([a-zA-Z]+)\}$/.exec(referenceText)
		if (customLocalString) {
			var camelCase = Case.camel(customLocalString[1])
			return currentEntry[camelCase];
		}

		var refString = /^\{REF:(T|U|P|A|N|I)@(T|U|P|A|N|I|O):(.+)\}$/.exec(referenceText);
		if (refString) {
			var wantedField = getPropertyNameFromCode(refString[1]);
			var searchIn = getPropertyNameFromCode(refString[2]);
			var text = refString[3];

			var matches = allEntries.filter(function(e) {
				if (searchIn === '*') {
					var customFieldMatches = e.keys.filter(function(key) {
						return String(e[key] || '').indexOf(text) !== -1;
					});
					return customFieldMatches.length > 0;
				} else {
					return String(e[searchIn] || '').indexOf(text) !== -1;
				}
			});
			if (matches.length) {
				if (my.majorVersion >= 3)
					return my.keewebGetDecryptedFieldValue(matches[0], wantedField);
				else
					return streamCipher.getDecryptedFieldValue(matches[0], wantedField);
			}
		}

		return referenceText;
	}

	my.resolveReference = resolveReference;

	function getPropertyNameFromCode(code) {
		switch (code) {
			case 'T': return 'title';
			case 'U': return 'userName';
			case 'P': return 'password';
			case 'A': return 'url';
			case 'N': return 'notes';
			case 'I': return 'id';
			case 'O': return '*';
		}

		return '';
	}

	return my;
}
