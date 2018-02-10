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
			<h4>Local Key Offloading</h4>
			<p>If enabled, Tusk can help keep you safe by offloading 
				the temporary key used to encrypt your master credentials in-memory. 
				This function is only useful if you frequently use the "Remember for {n} hours" feature.
				If enabled, Tusk will transmit randomly generated keys to AWS
				and cache them for up to 48 hours. <b>NO personal data will EVER be sent</b> </p>
		</div>
		<div class="box-bar roomy lighter">
			<div class="switch">
				<label>
					{{ pageState.offloadEnabled ? 'Local Key Offload Enabled' : 'Local Key Offload Disabled' }}
					<input type="checkbox" :checked="pageState.offloadEnabled" @click="toggleOffload">
					<span class="lever"></span>
				</label>
			</div>
		</div>
		
		<div class="box-bar roomy">
			<h4>Stored Data</h4>
			<p>The following objects represent the current data cached in chrome storage. This data is only available to Tusk, and is never sent over any network connection.</p>
		</div>
		<div class="box-bar between lighter roomy" v-for="blob in jsonState">
			<div class="json" :id="blob.k"></div>
			<a v-if="blob.delete !== undefined" class="waves-effect waves-light btn" @click="blob.delete.f(blob.delete.arg); init()">{{ blob.delete.op }}</a>
		</div>
	</div>
</template>

<script>
	import JSONFormatter from 'json-formatter-js'

	export default {
		props: {
			settings: Object,
			secureCacheMemory: Object,
		},
		data() {
			return {
				busy: false,
				expireTime: 2,
				pageState: {
					offloadEnabled: false
				},
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
						k: 'offloaderToken',                    // key
						f: this.settings.getSetOffloaderToken,  // getter
						delete: {
							f: this.settings.destroyLocalStorage, // remover
							arg: 'offloaderToken',                // remover args
							op: 'Delete'                          // remover button name
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
			toggleOffload() {
				if (this.pageState.offloadEnabled) {
					this.settings.getSetLocalKeyOffload(false)
				} else {
					this.settings.getSetLocalKeyOffload(true)
				}
			},
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
							document.getElementById(blob.k).parentNode.remove()
						}
					})
				})
				this.settings.getSetLocalKeyOffload().then(enabled => {
					this.pageState.offloadEnabled = enabled;
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