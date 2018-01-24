<template>
	<div>
		
		<div class="box-bar roomy">
			<h4>Expiration Check Interval</h4>
			<p>Every N minutes, Tusk will wake up and check if anything needs to be cleared.  This includes sensitive information stored in memory like your master key as well as text that was put on the clipboard.</p>
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
				this.settings.getSetExpireInterval(parseInt(newval))
			}
		},
		methods: {
			triggerForgetStuffAlarm(event) {
				this.secureCacheMemory.forgetStuff()
			},
			init() {
				this.settings.getSetExpireInterval().then(val => {
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