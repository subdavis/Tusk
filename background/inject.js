let $ = require('jquery')

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	"use strict";

	if (!message || !message.m)
		return; //unrecognized message format

	//whitelist some known iframe origin mismatches
	var whiteListedHostnameMismatches = [
		{documentOrigin: 'onlinebanking.usbank.com', expectedOrigin: 'www.usbank.com'}
	]

	if (message.m == 'ping') {
		// ping, to check if we're injected already
		sendResponse({'message': 'hi'});
		return;
	}

	if (message.m == "fillPassword") {
		//user has selected to fill the password

		//first check the origins.  This is necessary because we support iframes, and
		//this script is injected into all, some of which may be malicious.  So we
		//limit ourselves to the same origin.  Protocol (http vs https) is allowed to
		//mismatch, but in that case we will only fill the password on the https.
		var documentOrigin = parseUrl(document.URL);
		var expectedOrigin = parseUrl(message.o);
		var whiteListed = !!whiteListedHostnameMismatches.filter(function(item) {
			return item.documentOrigin === documentOrigin.hostname && item.expectedOrigin === expectedOrigin.hostname
		}).length;

		if ((documentOrigin.hostname !== expectedOrigin.hostname && !whiteListed)
			|| (documentOrigin.protocol !== expectedOrigin.protocol && documentOrigin.protocol !== 'https:'))
			return;

		//passed the origin check - go ahead and fill the password
		filler.fillPassword(message.u, message.p);
	}

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
});

var filler = (function() {
	"use strict";

	var userPasswordPairs = [];
	var lonelyPasswords = [];  //passwords without usernames
	var priorityPair = null;   //most likely pair of fields.

	function identifyPasswordFields() {
		//identify user/password pairs
		userPasswordPairs = [];
		lonelyPasswords = [];
		priorityPair = null;
		var inputPattern = "input[type='text'], input[type='email'], input[type='password'], input:not([type])";

		//algorithm 1 - based on focused field
		var focusedField = $(inputPattern).filter(':focus');
		if (focusedField.length) {
			var pair = {}, focusedPassword = false;
			if (isPasswordField(focusedField)) {
				pair.p = focusedField;
				focusedPassword = true;
			} else {
				pair.u = focusedField;
			}

			var all = $(inputPattern);
			var focusedIndex = all.index(focusedField);
			if (focusedIndex > -1 && focusedIndex < all.length) {
				if (focusedPassword && focusedIndex > 0) {
					//field before the password is the username
					pair.u = all.eq(focusedIndex - 1);
				} else if (!focusedPassword && focusedIndex < all.length) {
					//field after the username is the password
					pair.p = all.eq(focusedIndex + 1);
				}
			}

			priorityPair = pair;
		}

		//algorithm 2 - based on types of fields and visibility
		var possibleUserName;
		var lastFieldWasPassword = false; //used to detect registration forms which have 2 password fields, one after the other
		$(inputPattern).each(function() {
			var field = $(this);
			if (isElementInViewport(field) && field.is(':visible')) {
				if (isPasswordField(field)) {
					if (possibleUserName) {
						userPasswordPairs.push({
							'u': possibleUserName,
							'p': field
						});
						possibleUserName = null;
						lastFieldWasPassword = true;
					} else if (lastFieldWasPassword) {
						//special case - two passwords in a row means it is a registration form, so remove last-added pair
						userPasswordPairs.pop();
						lastFieldWasPassword = false;
					} else {
						//special case = password by itself
						lonelyPasswords.push(field);
					}
				}
				else {
					possibleUserName = field;
					lastFieldWasPassword = false;
				}
			}
		});
	}

	function isPasswordField(field) {
		if (field.attr('type') && field.attr('type').toLowerCase() == 'password')
			return true;

		return false;
	}

	function fillPassword(username, password) {
		identifyPasswordFields();
		var filled = false;

		if (priorityPair) {
			//don't bother with the others, this is the one
			if (priorityPair.u && priorityPair.u.is(':visible'))
				fillField(priorityPair.u, username);

			if (priorityPair.p && priorityPair.p.is(':visible'))
				fillField(priorityPair.p, password);

			return;
		}

		if (userPasswordPairs.length > 0) {
			//we have found some possible username/passwords.  Check if the are visible:
			for (var i = 0; i < userPasswordPairs.length; i++) {
				var pair = userPasswordPairs[i];
				if (!filled && isElementInViewport(pair.u) && isElementInViewport(pair.p)
				&& pair.p.is(":visible")) {
					filled = fillField(pair.p, password);
					if (pair.u.is(":visible")) {
						//sometimes the username is invisible, i.e. google login
						fillField(pair.u, username);
					}
				}
			}
		}

		if (!filled) {
			for (var i=0; i<lonelyPasswords.length; i++) {
				var lonelyPassword = lonelyPasswords[i];
				if (!filled && isElementInViewport(lonelyPassword) && lonelyPassword.is(':visible')) {
					filled = fillField(lonelyPassword, password);
				}
			}
		}
	}

	function fillField(field, val) {
		sendKeyEvent(field);
		field.val(val);
		var filled = (field.val() === val);
		return filled;
	}

	function sendKeyEvent(field) {
		field.focus();

		var eventsToFire = {
			keydown: 'KeyboardEvent',
			keyup  : 'KeyboardEvent',
			change : 'HTMLEvents',
		};

		window.setTimeout(function() {
			for (var i in eventsToFire) {
				var evt = document.createEvent(eventsToFire[i]);
				evt.initEvent(i, true, true);
				field.get(0).dispatchEvent(evt);
			}
		});
	}

	/**
	function to determine if element is visible
	*/
	function isElementInViewport(el) {
		//special bonus for those using jQuery
		if (el instanceof $) {
			el = el[0];
		}

		var rect = el.getBoundingClientRect();
		return (
			rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&  /*or $(window).height() */
			rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */);
	}

	return {
		fillPassword: fillPassword
	};
})();