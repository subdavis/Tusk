"use strict";

/*
 * Background.js
 * 
 * This page runs as an Background page, not an event or ephemeral page.
 * The purpose of this is to persist data in the browser process memory for
 * long periods of time.
 */

import { ProtectedMemory } from '$services/protectedMemory'
import { Notifications } from "$services/notifications"
import { BackgroundStore } from '@/store'
import { UPGRADE } from '@/store/modules/database'
import {
	FORGET_TIMES_CLEAR,
	LAST_OPENED_GET,
	createCacheKey,
} from '@/store/modules/settings'

const notifications = new Notifications()
const protectedMemory = new ProtectedMemory()
const store = BackgroundStore

// function to determine if the content script is already injected, so we don't do it twice
function alreadyInjected(tabId) {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage(tabId, { m: 'ping' }, response => resolve(!!response))
	})
}

function handleMessage(message, sender, sendResponse) {
	if (!message || !message.m) {
		return null; // message format unrecognized
	} else if (message.m == "showMessage") {
		const expire = typeof message.expire !== 'undefined' ? message.expire * 1000 : 60000;
		chrome.notifications.create({
			'type': 'basic',
			'iconUrl': '/assets/icons/exported/48x48.png',
			'title': 'Tusk',
			'message': message.text
		}, function (notificationId) {
			setTimeout(() => chrome.notifications.clear(notificationId), expire)
		})
	} else if (message.m == "requestPermission") {
		//better to do the request here on the background, because on some platforms
		//the popup may close prematurely when requesting access
		chrome.permissions.contains(message.perms, function (alreadyGranted) {
			if (chrome.runtime.lastError || (alreadyGranted && message.then)) {
				handleMessage(message.then, sender, sendResponse);
			} else {
				//request
				chrome.permissions.request(message.perms, function (granted) {
					if (granted && message.then) {
						handleMessage(message.then, sender, sendResponse);
					}
				});
			}
		});
	} else if (message.m == "autofill") {
		alreadyInjected(message.tabId).then(injectedAlready => {
			if (injectedAlready === true) {
				chrome.tabs.sendMessage(message.tabId, {
					m: "fillPassword",
					u: message.u,
					p: message.p,
					o: message.o
				});
				return;
			}
			chrome.tabs.executeScript(message.tabId, {
				file: "build/inject.build.js",
				allFrames: true,
				runAt: "document_start"
			}, function (result) {
				//script injected
				console.log("injected")
				chrome.tabs.sendMessage(message.tabId, {
					m: "fillPassword",
					u: message.u,
					p: message.p,
					o: message.o
				});
			});
		})
	}
}

function forgetStuff() {
	const now = Date.now()
	console.info("ForgetStuff", now)
	protectedMemory.clearData('secureCache.entries'); // ALWAYS clear entries.
	const allTimes = store.state.settings.forgetTimes;
	const forgottenKeys = [];
	for (var key in allTimes) {
		// If the time has passed but is still positive...
		if (allTimes[key] < now && allTimes[key] > 0) {
			forgottenKeys.push(key);
			switch (key) {
			case 'clearClipboard':
				clearClipboard();
				notifications.push({
					text: 'Clipboard cleared',
					type: 'expiration',
					expire: 2
				});
				break;
			default:
				if (key.indexOf('password') >= 0) {
					forgetPassword().then(() => {
						notifications.push({
							text: 'Remember password expired',
							type: 'expiration'
						});
					})
				} else {
					console.error("I don't know what to do with key", key)
				}
			}
		}
	}
	//remove stuff
	store.commit(FORGET_TIMES_CLEAR, { keys: forgottenKeys })
}

function clearClipboard() {
	var clearClipboard = function (e) {
		e.clipboardData.setData('text/plain', "");
		e.preventDefault();
		document.removeEventListener('copy', clearClipboard); //don't listen anymore
	}

	document.addEventListener('copy', clearClipboard);
	document.execCommand('copy');
}

function forgetPassword() {
	let lastOpened = store.getters[LAST_OPENED_GET]
	let key = createCacheKey(lastOpened)
	return protectedMemory.clearData(key)
}

// Listeners and Alarms
chrome.runtime.onMessage.addListener(handleMessage)
chrome.alarms.create("forgetStuff", {
	delayInMinutes: 1,
	periodInMinutes: 2
});
chrome.alarms.onAlarm.addListener(function (alarm) {
	if (alarm.name == 'forgetStuff') {
		forgetStuff();
	}
});
chrome.runtime.onInstalled.addListener(() => store.dispatch(UPGRADE));
chrome.runtime.onStartup.addListener(forgetStuff);
//keep saved state for the popup for as long as we are alive:
chrome.runtime.onConnect.addListener((port) => {
	//communicate state on this pipe.  each named port gets its own state.
	port.onMessage.addListener((msg) => {
		console.log(msg);
		if (!msg) return;
		switch (msg.action) {
			case 'clear':
				protectedMemory.clearData(msg.key);
				break;
			case 'save':
				protectedMemory.setData(msg.key, msg.value);
				break;
			case 'get':
				protectedMemory.getData(msg.key).then(function (value) {
					port.postMessage(value);
				});
				break;
			case 'forgetStuff':
				forgetStuff();
				break;
			default:
				throw new Error('unrecognized action ' + obj.action)
				break;
		}
	});
});
