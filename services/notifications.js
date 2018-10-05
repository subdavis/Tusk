export class Notifications {
	constructor(settings) {
		this.settings = settings;
	}
	push(data) {
		const { text, type, expire } = data;
		return new Promise((resolve, reject) => {
			this.settings.getSetNotificationsEnabled().then(val => {
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
		});
	}
}
