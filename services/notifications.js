import store from '@/store'

export class Notifications {
	push(data) {
		const { text, type, expire } = data;
		return new Promise((resolve) => {
			let val = store.state.settings.notificationsEnabledList
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
