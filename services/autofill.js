"use strict";

import { KeepassReference } from './keepassReference'
import { Notifications } from './notifications'
import { FORGET_TIME_SET, CLIPBOARD_EXPIRE_INTERVAL } from '@/store/modules/settings'
// TODO: hack to allow access to `setForgetTime`.
// Services should not have direct access to the store.s
import store from '@/store'

/**
 * Shared state and methods for an unlocked password file.
 */
class Autofill {

	constructor(settings) {
		this.settings = settings
		this.notifications = new Notifications(settings)
		this.keepassReference = new KeepassReference()
		this.copyData = {
			copyPart: null,
			copyEntry: null,
		}
		document.addEventListener('copy', this.handleCopy.bind(this))
		console.log(this.copyData)
	}

	handleCopy(e) {
		console.log(this, e)
		const copyEntry = this.copyData.copyEntry
		const copyPart = this.copyData.copyPart
		if (!copyEntry && !copyPart) {
			console.error('Copy event triggered without setting state.')
			return;
		}
		var textToPutOnClipboard = this.keepassReference.getFieldValue(copyEntry, copyPart);
		var fieldName = copyPart.charAt(0).toUpperCase() + copyPart.slice(1); // https://stackoverflow.com/a/1026087
		this.copyData.copyEntry = null;
		this.copyData.copyPart = null;
		e.clipboardData.setData('text/plain', textToPutOnClipboard);
		e.preventDefault();

		const interval = this.settings.getSet(CLIPBOARD_EXPIRE_INTERVAL)
		store.commit(FORGET_TIME_SET, { key: 'clearClipboard', time: Date.now() + interval * 60 * 1000});
		this.notifications.push({
			text: fieldName + ' copied to clipboard.  Clipboard will clear in ' + interval + ' minute(s).',
			type: 'clipboard',
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
				p: this.keepassReference.getFieldValue(entry, 'password'),
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
