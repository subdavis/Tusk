export class Notifications {
	constructor(settings) {
		this.settings = settings;
	}
	push = (data) => {
		const { text } = data;
		return new Promise ((resolve, reject) => {
			this.settings.getSetNotificationsEnabled().then(val => {
				if (val) {
					chrome.runtime.sendMessage({
						m: "showMessage",
						text,
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
