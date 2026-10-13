/*
Inject script

- Invoked when Tusk popup 'autofill' action is selected.
- Background will attempt to inject this script into the page, and the script will listen for a user/pass combo from background.
*/
import browser from 'webextension-polyfill';
import { isVisible, parseUrl } from '@/lib/utils';

type Message = { m: 'ping' } | { m: 'fillPassword'; u: string; p: string; o: string };

// whitelist some known iframe origin mismatches
const whiteListedHostnameMismatches = [
  { documentOrigin: 'onlinebanking.usbank.com', expectedOrigin: 'www.usbank.com' },
];

browser.runtime.onMessage.addListener((raw) => {
  const message = raw as Message;
  if (!message || !message.m) return; // unrecognized message format

  if (message.m == 'ping') {
    // ping, to check if we're injected already
    return Promise.resolve({ message: 'hi' });
  }

  if (message.m == 'fillPassword') {
    // user has selected to fill the password

    // first check the origins.  This is necessary because we support iframes, and
    // this script is injected into all, some of which may be malicious.  So we
    // limit ourselves to the same origin.  Protocol (http vs https) is allowed to
    // mismatch, but in that case we will only fill the password on the https.
    const documentOrigin = parseUrl(document.URL);
    const expectedOrigin = parseUrl(message.o);
    if (!documentOrigin || !expectedOrigin) return;
    const whiteListed = whiteListedHostnameMismatches.some(
      (item) =>
        item.documentOrigin === documentOrigin.hostname &&
        item.expectedOrigin === expectedOrigin.hostname
    );

    if (
      (documentOrigin.hostname !== expectedOrigin.hostname && !whiteListed) ||
      (documentOrigin.protocol !== expectedOrigin.protocol && documentOrigin.protocol !== 'https:')
    )
      return;

    // passed the origin check - go ahead and fill the password
    filler.fillPassword(message.u, message.p);
  }
});

interface UserPasswordPair {
  u?: HTMLInputElement;
  p?: HTMLInputElement;
}

const filler = (() => {
  let userPasswordPairs: UserPasswordPair[] = [];
  let lonelyPasswords: HTMLInputElement[] = []; // passwords without usernames
  let priorityPair: UserPasswordPair | null = null; // most likely pair of fields.

  function identifyPasswordFields() {
    // identify user/password pairs
    userPasswordPairs = [];
    lonelyPasswords = [];
    priorityPair = null;
    const inputList = Array.from(document.getElementsByTagName('INPUT')) as HTMLInputElement[];

    // Method 1 - based on focused field (the thing your cursor is in)
    const activeElem = document.activeElement;
    const focusedIndex = inputList.indexOf(activeElem as HTMLInputElement);
    if (inputList.length && focusedIndex >= 0) {
      const pair: UserPasswordPair = {};
      let focusedPassword = false;
      if (isPasswordField(activeElem as HTMLInputElement)) {
        pair.p = activeElem as HTMLInputElement;
        focusedPassword = true;
      } else {
        pair.u = activeElem as HTMLInputElement;
      }

      // Assumption:
      // * username will always come before password
      // * username and password will always be adjacent
      if (focusedPassword && focusedIndex > 0) {
        // field before the password is the username
        pair.u = inputList[focusedIndex - 1];
      } else if (!focusedPassword && focusedIndex < inputList.length - 1) {
        // field after the username is the password
        const passwordFieldCandidate = inputList[focusedIndex + 1];
        if (isPasswordField(passwordFieldCandidate)) pair.p = passwordFieldCandidate;
      }
      priorityPair = pair;
    }

    // Methods 2 - based on types of fields and visibility
    let possibleUserName: HTMLInputElement | undefined;
    let lastFieldWasPassword = false; // used to detect registration forms which have 2 password fields, one after the other
    inputList.forEach((field) => {
      if (isElementInViewport(field) && isVisible(field)) {
        if (isPasswordField(field)) {
          if (possibleUserName) {
            userPasswordPairs.push({ u: possibleUserName, p: field });
            possibleUserName = undefined;
            lastFieldWasPassword = true;
          } else if (lastFieldWasPassword) {
            // special case - two passwords in a row means it is a registration form, so remove last-added pair
            userPasswordPairs.pop();
            lastFieldWasPassword = false;
          } else {
            // special case = password by itself
            lonelyPasswords.push(field);
          }
        } else {
          possibleUserName = field;
          lastFieldWasPassword = false;
        }
      }
    });
  }

  function isPasswordField(field: HTMLInputElement): boolean {
    const typeAttr = field.getAttribute('type');
    return !!typeAttr && typeAttr.toLowerCase() == 'password';
  }

  function fillPassword(username: string, password: string) {
    identifyPasswordFields();
    let filled = false;

    if (priorityPair) {
      // don't bother with the others, this is the one
      if (priorityPair.u && isVisible(priorityPair.u)) fillField(priorityPair.u, username);
      if (priorityPair.p && isVisible(priorityPair.p)) fillField(priorityPair.p, password);
      return;
    }

    if (userPasswordPairs.length > 0) {
      // we have found some possible username/passwords.  Check if the are visible:
      for (const pair of userPasswordPairs) {
        if (
          !filled &&
          pair.u &&
          pair.p &&
          isElementInViewport(pair.u) &&
          isElementInViewport(pair.p) &&
          isVisible(pair.p)
        ) {
          filled = fillField(pair.p, password);
          if (isVisible(pair.u)) {
            // sometimes the username is invisible, i.e. google login
            fillField(pair.u, username);
          }
        }
      }
    }

    if (!filled) {
      for (const lonelyPassword of lonelyPasswords) {
        if (!filled && isElementInViewport(lonelyPassword) && isVisible(lonelyPassword)) {
          filled = fillField(lonelyPassword, password);
        }
      }
    }
  }

  function fillField(field: HTMLInputElement, val: string): boolean {
    field.value = val;
    const filled = field.value === val;
    sendKeyEvent(field);
    return filled;
  }

  function sendKeyEvent(field: HTMLInputElement) {
    field.focus();

    const eventsToFire: Record<string, string> = {
      keydown: 'KeyboardEvent',
      keyup: 'KeyboardEvent',
      change: 'HTMLEvents',
    };

    window.setTimeout(() => {
      for (const eventName in eventsToFire) {
        const evt = document.createEvent(eventsToFire[eventName]);
        evt.initEvent(eventName, true, true);
        field.dispatchEvent(evt);
      }
    });
  }

  /**
   * function to determine if element is in the part of the screen on the monitor
   */
  function isElementInViewport(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  return { fillPassword };
})();
