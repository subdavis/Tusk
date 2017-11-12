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

"use strict";

/**
 * Shared state and methods for an unlocked password file.
 */
module.exports = function UnlockedState($router, chromePromise, keepassReference, protectedMemory, settings) {
	var my = {
		tabId: "", //tab id of current tab
		url: "", //url of current tab
		title: "", //window title of current tab
		origin: "", //url of current tab without path or querystring
		sitePermission: false, //true if the extension already has rights to autofill the password
		entries: null, //filtered password database entries
		clipboardStatus: "" //status message about clipboard, used when copying password to the clipboard
	};
	var copyEntry;

	//determine current url:
	my.getTabDetails = function() {
		return new Promise(function(resolve, reject) {
			chrome.tabs.query({
				active: true,
				currentWindow: true
			}, function(tabs) {
				if (tabs && tabs.length) {
					my.tabId = tabs[0].id;
					var url = tabs[0].url.split('?');
					my.url = url[0];
					my.title = tabs[0].title;

					var parsedUrl = parseUrl(tabs[0].url);
					my.origin = parsedUrl.protocol + '//' + parsedUrl.hostname + '/';

					chromePromise.permissions.contains({
						origins: [my.origin]
					})
						.then(function() {
							my.sitePermission = true;
						})
						.catch(function(err) {
							my.sitePermission = false;
						})
						.then(function() {
							resolve();
						})
				} else {
					reject(new Error("Unable to determine tab details"));
				}
			});
		});
	};

	my.clearBackgroundState = function() {
		my.entries = null;
		my.clipboardStatus = "";
	}
	setTimeout(my.clearBackgroundState, 60000);  //clear backgroundstate after 10 minutes live - we should never be alive that long

	my.autofill = function(entry) {
		settings.getUseCredentialApiFlag().then(useCredentialApi => {
			chrome.runtime.sendMessage({
				m: "requestPermission",
				perms: {
					origins: [my.origin]
				},
				then: {
					m: "autofill",
					tabId: my.tabId,
					u: entry.userName,
					p: getPassword(entry),
					o: my.origin,
					uca: useCredentialApi
				}
			});

			window.close(); //close the popup
		})
	}

	//get clear-text password from entry
	function getPassword(entry) {
		return my.getDecryptedAttribute(entry, 'password');
	}

	my.copyPassword = function(entry) {
		copyEntry = entry;
		document.execCommand('copy');
	}

	my.gotoDetails = function(entry) {
		$router.route('/entry-details/' + entry.id);
	}

	my.getDecryptedAttribute = function(entry, attributeName) {
		return keepassReference.getFieldValue(entry, attributeName, my.entries);
	}

	//listens for the copy event and does the copy
	document.addEventListener('copy', function(e) {
		if (!copyEntry) {
			return; //listener can get registered multiple times
		}

		var textToPutOnClipboard = getPassword(copyEntry);
		copyEntry = null;
		e.clipboardData.setData('text/plain', textToPutOnClipboard);
		e.preventDefault();

		settings.setForgetTime('clearClipboard', Date.now() + 1 * 60000)
		chrome.alarms.clear("forgetStuff", function() {
			//reset alarm timer so that it fires about 1 minute from now
			chrome.alarms.create("forgetStuff", {
				delayInMinutes: 1,
				periodInMinutes: 10
			});
		})

		chrome.runtime.sendMessage({
			m: "showMessage",
			text: 'Password copied to clipboard.  Clipboard will clear in 60 seconds.'
		});

		window.close(); //close the popup
	});

	function parseUrl(url) {
		//from https://gist.github.com/jlong/2428561
		var parser = document.createElement('a');
		parser.href = url;

		/*
    parser.protocol; // => "http:"
    parser.hostname; // => "example.com"
    parser.port;     // => "3000"
    parser.pathname; // => "/pathname/"
    parser.search;   // => "?search=test"
    parser.hash;     // => "#hash"
    parser.host;     // => "example.com:3000"
    */

		return parser;
	}

	return my;
}
