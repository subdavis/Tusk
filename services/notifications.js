import { NOTIFICATIONS_ENABLED } from '@/store/modules/settings.js'

export class Notifications {
	constructor(settings) {
		this.settings = settings;
	}
	push(data) {
		const { text, type, expire } = data;
		return new Promise((resolve, reject) => {
			let val = this.settings.getSet(NOTIFICATIONS_ENABLED)
			if (val.indexOf(type) > -1) {
				chrome.runtime.sendMessage({
					m: "showMessage",
					text,
					expire,
				}, response => resolve(response));
			} else {
				resolve();
			}
		});
	}
}
