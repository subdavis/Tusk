"use strict";

import { Notifications } from './notifications'

/**
 * Shared state and methods for an unlocked password file.
 */
class Autofill {

	constructor(settings) {
		this.settings = settings
		this.notifications = new Notifications(settings)
		this.copyData = {
			copyPart: null,
			copyEntry: null,
		}
		document.addEventListener('copy', this.handleCopy)
	}

	handleCopy(e) {
		const copyEntry = this.copyData.copyEntry
		const copyPart = this.copyData.copyPart
		if (!copyEntry && !copyPart) {
			console.error('Copy event triggered without setting state.')
			return;
		}
		var textToPutOnClipboard = getAttribute(copyEntry, copyPart);
		var fieldName = copyPart.charAt(0).toUpperCase() + copyPart.slice(1); // https://stackoverflow.com/a/1026087
		this.copyData.copyEntry = null;
		this.copyData.copyPart = null;
		e.clipboardData.setData('text/plain', textToPutOnClipboard);
		e.preventDefault();

		this.settings.getSetClipboardExpireInterval().then(interval => {
			this.settings.setForgetTime('clearClipboard', Date.now() + interval * 60000);
			this.notifications.push({
				text: fieldName + ' copied to clipboard.  Clipboard will clear in ' + interval + ' minute(s).',
				type: 'clipboard',
			}).then(() => window.close())
		})
	}

	autofill(entry) {
		chrome.runtime.sendMessage({
			m: "requestPermission",
			perms: {
				origins: [my.origin]
			},
			then: {
				m: "autofill",
				tabId: my.tabId,
				u: entry.userName,
				p: getAttribute(entry, 'password'),
				o: my.origin
			}
		});

		window.close(); //close the popup
	}

	copyPassword(entry) {
		this.copyData.copyPart = 'password';
		this.copyData.copyEntry = entry;
		document.execCommand('copy');
	}

	copyUsername(entry) {
		this.copyData.copyPart = 'userName';
		this.copyData.copyEntry = entry;
		document.execCommand('copy');
	}
}

export {
	Autofill
}
