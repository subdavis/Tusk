export class Notifications {
	constructor(settings) {
		this.settings = settings;
	}
	push(data) {
		const { text, type, expire } = data;
		return new Promise ((resolve, reject) => {
			this.settings.getSetNotificationsEnabled().then(val => {
				if (val.indexOf(type) > -1) {
					chrome.runtime.sendMessage({
						m: "showMessage",
						text,
						expire,
					}, response => {
						if (typeof response === "undefined" && chrome.runtime.lastError) {
							reject(chrome.runtime.lastError.message);
						} else {
							resolve(response);
						}
					});
				} else {
					resolve();
				}
			});
		});
	}
}
