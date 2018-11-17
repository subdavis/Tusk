<script>
import { generateSettingsAdapter } from '@/store/modules/settings'
import JSONFormatter from 'json-formatter-js'
import { isFirefox } from '$lib/utils'

export default {
	data() {
		return {
			busy: false,
			expireTime: 2,
			settings: generateSettingsAdapter(this.$store),
			hotkeyNavEnabled: false,
			allOriginPermission: false,
			allOriginPerms: {
				origins: [
					"https://*/*",
					"http://*/*"
				]
			},
			strictMatchEnabled: false,
			notificationsEnabled: ['expiration'],
			jsonState: [{
				k: 'databaseUsages',                      // key
				f: this.settings.getSetDatabaseUsages,    // getter
				delete: {
					f: this.settings.destroyLocalStorage, // remover
					arg: 'databaseUsages',                // remover args
					op: 'Delete'                          // remover button name
				}
			},
			{
				k: 'webdavServerList',
				f: this.settings.getSetWebdavServerList,
				delete: {
					f: this.settings.destroyLocalStorage,
					arg: 'webdavServerList',
					op: 'Delete'
				}
			},
			{
				k: 'webdavDirectoryMap',
				f: this.settings.getSetWebdavDirectoryMap,
				delete: {
					f: this.settings.destroyLocalStorage,
					arg: 'webdavDirectoryMap',
					op: 'Delete'
				}
			},
			{
				k: 'selectedDatabase',
				f: this.settings.getCurrentDatabaseChoice,
				delete: {
					f: this.settings.destroyLocalStorage,
					arg: 'selectedDatabase',
					op: 'Delete'
				}
			},
			{
				k: 'keyFiles',
				f: this.settings.getKeyFiles,
				delete: {
					f: this.settings.deleteAllKeyFiles,
					arg: undefined,
					op: 'Delete'
				}
			},
			{
				k: 'forgetTimes',
				f: this.settings.getAllForgetTimes
			},
			{
				k: 'sharedUrlList',
				f: this.settings.getSharedUrlList,
				delete: {
					f: this.settings.destroyLocalStorage,
					arg: 'sharedUrlList',
					op: 'Delete'
				}
			},
			]
		}
	},
	watch: {
		expireTime(newval, oldval) {
			this.settings.getSetClipboardExpireInterval(parseInt(newval))
		},
		hotkeyNavEnabled(newval, oldval) {
			this.settings.getSetHotkeyNavEnabled(newval)
		},
		strictMatchEnabled(newval, oldval) {
			this.settings.getSetStrictModeEnabled(newval)
		},
		notificationsEnabled(newval) {
			this.settings.getSetNotificationsEnabled(newval)
		}
	},
	methods: {
		isFirefox: isFirefox,
		toggleOriginPermissions(evt) {
			// Negated because this function will call before the vue model update.
			if (!this.allOriginPermission) {
				chrome.permissions.request(this.allOriginPerms);
			} else {
				chrome.permissions.remove(this.allOriginPerms);
			}
			this.settings.getSetOriginPermissionEnabled(!this.allOriginPermission);
			this.allOriginPermission = !this.allOriginPermission;
		},
		init() {
			this.settings.getSetClipboardExpireInterval().then(val => {
				this.expireTime = val
			})
			this.settings.getSetHotkeyNavEnabled().then(val => {
				this.hotkeyNavEnabled = val
			})
			this.settings.getSetNotificationsEnabled().then(val => {
				this.notificationsEnabled = val
			})
			this.settings.getSetStrictModeEnabled().then(val => {
				this.strictMatchEnabled = val;
			})
			if (!isFirefox()) {
				chrome.permissions.contains(this.allOriginPerms, granted => {
					this.allOriginPermission = !!granted;
				});
			}
			this.jsonState.forEach(blob => {
				blob.f().then(result => {
					if (result && Object.keys(result).length) {
						let formatter = new JSONFormatter(result)
						let place = document.getElementById(blob.k)
						while (place.firstChild) place.removeChild(place.firstChild);
						place.appendChild(formatter.render())
					} else {
						document.getElementById(blob.k).parentNode.parentNode.remove();
					}
				});
			});
		}
	},
	mounted() {
		this.init();
	}
}
</script>

<template lang="pug">
div
	.box-bar.roomy
		h4 Clipboard Expiration Time
		p
			| When you copy a value to the clipboard, Tusk will set a timeout to automatically clear it again.
			| You can choose how long this timeout will last.
	.box-bar.roomy.lighter
		select(style='display: inline-block;', v-model='expireTime')
			option(value='1') 1 minute
			option(value='2') 2 minutes
			option(value='3') 3 minutes
			option(value='5') 5 minutes
			option(value='8') 8 minutes
	.box-bar.roomy
		h4 Enable Hotkey Navigation
		p
			| If enabled, you will be able to use [TAB] and [ENTER] to navigate and autofill your
			| passwords when the tusk UI is open.  By default, [CTRL]+[SHIFT]+[SPACE] will open the Tusk popup
	.box-bar.roomy.lighter
		div
			.switch
				label
					input(type='checkbox', v-model='hotkeyNavEnabled')
					span.lever
					| Hotkey Navigation
	.box-bar.roomy(v-if='!isFirefox()')
		h4 Grant Permission on All Websites
		p
			strong(style='color:#d9534f') Only proceed if you know what you're doing.
			| If enabled, the extension prompts once for permission to access and change data on 
			| all websites which disables the permissions popup on each new website. This has 
			a(href='https://github.com/subdavis/Tusk/issues/168') serious security implications
			| . Only applies to Chrome.  Because of a Chrome bug, it is currently impossible to 
			| revoke this permission again after it is enabled.  If you turn this ON, Tusk must be reinstalled to reset.
	.box-bar.roomy.lighter(v-if='!isFirefox()')
		div
			.switch
				label(v-on:click='toggleOriginPermissions')
					input(type='checkbox', v-model='allOriginPermission')
					span.lever(@click.prevent='')
					| 						Grant All Permissions
	.box-bar.roomy
		h4 Notification
		p Choose which type of notification do you want to receive from Tusk.
	.box-bar.roomy.lighter
		div
			.switch
				label
					input(type='checkbox', value='expiration', v-model='notificationsEnabled')
					span.lever
					| Password expiration
			.switch
				label
					input(type='checkbox', value='clipboard', v-model='notificationsEnabled')
					span.lever
					|	Clipboard events
	.box-bar.roomy
		h4 Enable Strict Matching
		p
			| If enabled, only entries whose origins match exactly will be suggested for input.
			| Titles and other tab information will not be considered in matching.  For example,
		pre.
			\nwww.google.com      
		|  will not match 
		pre.
			\nhttps://google.com      
		p
	.box-bar.roomy.lighter
		div
			.switch
				label
					input(type='checkbox', v-model='strictMatchEnabled')
					span.lever
					| Strict Matching
	.box-bar.roomy
		h4 Stored Data
		p
			| The following objects represent the current data cached in local storage.
			| This data is only available to Tusk, and is never sent over any network connection.
	.box-bar.lighter.roomy(v-for='blob in jsonState')
		p {{blob.k}}
		.between
			.json(:id='blob.k')
			a.waves-effect.waves-light.btn(v-if='blob.delete !== undefined', @click='blob.delete.f(blob.delete.arg); init();') {{ blob.delete.op }}
</template>

<style lang="scss" scoped>
.json {
  font-size: 12px;
}
h4 {
  font-size: 24px;
}
</style>
