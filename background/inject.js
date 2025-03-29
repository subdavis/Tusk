import { isVisible, parseUrl } from '@/lib/utils.js';
/* 
Inject script

- Invoked when Tusk popup 'autofill' action is selected.
- Background will attempt to inject this script into the page, and the script will listen for a user/pass combo from background.
*/
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  'use strict';

  if (!message || !message.m) return; //unrecognized message format

  //whitelist some known iframe origin mismatches
  var whiteListedHostnameMismatches = [
    { documentOrigin: 'onlinebanking.usbank.com', expectedOrigin: 'www.usbank.com' },
  ];

  if (message.m == 'ping') {
    // ping, to check if we're injected already
    sendResponse({ message: 'hi' });
    return;
  }

  if (message.m == 'fillPassword') {
    //user has selected to fill the password

    //first check the origins.  This is necessary because we support iframes, and
    //this script is injected into all, some of which may be malicious.  So we
    //limit ourselves to the same origin.  Protocol (http vs https) is allowed to
    //mismatch, but in that case we will only fill the password on the https.
    var documentOrigin = parseUrl(document.URL);
    var expectedOrigin = parseUrl(message.o);
    var whiteListed = !!whiteListedHostnameMismatches.filter(function (item) {
      return (
        item.documentOrigin === documentOrigin.hostname &&
        item.expectedOrigin === expectedOrigin.hostname
      );
    }).length;

    if (
      (documentOrigin.hostname !== expectedOrigin.hostname && !whiteListed) ||
      (documentOrigin.protocol !== expectedOrigin.protocol && documentOrigin.protocol !== 'https:')
    )
      return;

    //passed the origin check - go ahead and fill the password
    filler.fillPassword(message.u, message.p);
  }
});

var filler = (function () {
  'use strict';

  var userPasswordPairs = [];
  var lonelyPasswords = []; //passwords without usernames
  var priorityPair = null; //most likely pair of fields.

  function identifyPasswordFields() {
    //identify user/password pairs
    userPasswordPairs = [];
    lonelyPasswords = [];
    priorityPair = null;
    var inputPattern =
      "input[type='text'], input[type='email'], input[type='password'], input:not([type])";
    var inputList = Array.from(document.getElementsByTagName('INPUT'));

    // Method 1 - based on focused field (the thing your cursor is in)
    var activeElem = document.activeElement;
    var focusedIndex = inputList.indexOf(activeElem);
    if (inputList.length && focusedIndex >= 0) {
      var pair = {},
        focusedPassword = false;
      if (isPasswordField(activeElem)) {
        pair.p = activeElem;
        focusedPassword = true;
      } else {
        pair.u = activeElem;
      }

      // Assumption:
      // * username will always come before password
      // * username and password will always be adjacent
      if (focusedIndex >= 0) {
        if (focusedPassword && focusedIndex > 0) {
          //field before the password is the username
          pair.u = inputList[focusedIndex - 1];
        } else if (!focusedPassword && focusedIndex < inputList.length - 1) {
          //field after the username is the password
          let passwordFieldCandidate = inputList[focusedIndex + 1];
          if (isPasswordField(passwordFieldCandidate)) pair.p = passwordFieldCandidate;
        }
      }
      priorityPair = pair;
    }

    // Methods 2 - based on types of fields and visibility
    var possibleUserName;
    var lastFieldWasPassword = false; //used to detect registration forms which have 2 password fields, one after the other
    inputList.forEach((field) => {
      if (isElementInViewport(field) && isVisible(field)) {
        if (isPasswordField(field)) {
          if (possibleUserName) {
            userPasswordPairs.push({
              u: possibleUserName,
              p: field,
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
        } else {
          possibleUserName = field;
          lastFieldWasPassword = false;
        }
      }
    });
  }

  function isPasswordField(field) {
    let type_attr = field.getAttribute('type');
    if (type_attr && type_attr.toLowerCase() == 'password') return true;
    return false;
  }

  function fillPassword(username, password) {
    identifyPasswordFields();
    var filled = false;

    if (priorityPair) {
      //don't bother with the others, this is the one
      if (priorityPair.u && isVisible(priorityPair.u)) fillField(priorityPair.u, username);

      if (priorityPair.p && isVisible(priorityPair.p)) fillField(priorityPair.p, password);

      return;
    }

    if (userPasswordPairs.length > 0) {
      //we have found some possible username/passwords.  Check if the are visible:
      for (var i = 0; i < userPasswordPairs.length; i++) {
        var pair = userPasswordPairs[i];
        if (
          !filled &&
          isElementInViewport(pair.u) &&
          isElementInViewport(pair.p) &&
          isVisible(pair.p)
        ) {
          filled = fillField(pair.p, password);
          if (isVisible(pair.u)) {
            //sometimes the username is invisible, i.e. google login
            fillField(pair.u, username);
          }
        }
      }
    }

    if (!filled) {
      for (var i = 0; i < lonelyPasswords.length; i++) {
        var lonelyPassword = lonelyPasswords[i];
        if (!filled && isElementInViewport(lonelyPassword) && isVisible(lonelyPassword)) {
          filled = fillField(lonelyPassword, password);
        }
      }
    }
  }

  function fillField(field, val) {
    field.value = val;
    var filled = field.value === val;
    sendKeyEvent(field);
    return filled;
  }

  function sendKeyEvent(field) {
    field.focus();

    var eventsToFire = {
      keydown: 'KeyboardEvent',
      keyup: 'KeyboardEvent',
      change: 'HTMLEvents',
    };

    window.setTimeout(function () {
      for (var i in eventsToFire) {
        var evt = document.createEvent(eventsToFire[i]);
        evt.initEvent(i, true, true);
        field.dispatchEvent(evt);
      }
    });
  }

  /**
   * function to determine if element is in the part of the screen on the monitor
   */
  function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) /*or $(window).height() */ &&
      rect.right <=
        (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
  }

  return {
    fillPassword: fillPassword,
  };
})();
