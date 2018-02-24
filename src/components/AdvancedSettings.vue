<template>
	<div>

		<div class="box-bar roomy">
			<h4>Clipboard Expiration Time</h4>
			<p>When you copy a value to the clipboard, Tusk will set a timeout to automatically clear it again.  You can choose how long this timeout will last.</p>
		</div>
		<div class="box-bar roomy lighter">
			<select style="display: inline-block;" v-model="expireTime">
				<option value="1">1 minute</option>
				<option value="2">2 minutes</option>
				<option value="3">3 minutes</option>
				<option value="5">5 minutes</option>
				<option value="8">8 minutes</option>
			</select>
		</div>

		<div class="box-bar roomy">
			<h4>Stored Data</h4>
			<p>The following objects represent the current data cached in local storage. This data is only available to Tusk, and is never sent over any network connection.</p>
		</div>
		<div class="box-bar lighter roomy" v-for="blob in jsonState">
			<p>{{blob.k}}</p>
			<div class="between">
				<div class="json" :id="blob.k"></div>
				<a v-if="blob.delete !== undefined" class="waves-effect waves-light btn" @click="blob.delete.f(blob.delete.arg); init()">{{ blob.delete.op }}</a>
			</div>
		</div>
	</div>
</template>

<script>
	import JSONFormatter from 'json-formatter-js'

	export default {
		props: {
			settings: Object,
			secureCacheMemory: Object
		},
		data() {
			return {
				busy: false,
				expireTime: 2,
				jsonState: [{
						k: 'databaseUsages',                    // key
						f: this.settings.getSetDatabaseUsages,  // getter
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
							f: this.settings.saveCurrentDatabase,
							arg: this.settings.destroyLocalStorage,
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
						k: 'sharedUrlList', // key
						f: this.settings.getSharedUrlList, // getter
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
			}
		},
		methods: {
			triggerForgetStuffAlarm(event) {
				this.secureCacheMemory.forgetStuff()
			},
			init() {
				this.settings.getSetClipboardExpireInterval().then(val => {
					this.expireTime = val;
				})
				this.jsonState.forEach(blob => {
					blob.f().then(result => {
						if (result && Object.keys(result).length) {
							let formatter = new JSONFormatter(result)
							let place = document.getElementById(blob.k)
							while (place.firstChild) place.removeChild(place.firstChild);
							place.appendChild(formatter.render())
						} else {
							document.getElementById(blob.k).parentNode.parentNode.remove()
						}
					})
				})
			}
		},
		mounted() {
			this.init()
		}
	}
</script>

<style lang="scss">
	@import "../styles/settings.scss";
	.json {
		font-size: 12px;
	}

	h4 {
		font-size: 24px;
	}
</style>
