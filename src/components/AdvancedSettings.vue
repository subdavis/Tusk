<template>
	<div>
		<div class="box-bar roomy">
			<h4>Enable on-disk password caching</h4>
			<p>Unless you use the "remember password" option, Tusk can only keep your password file open in-memory for a very brief time, typically about 10 seconds after you close the popup.  This can be frustrating if you have a long password and you need to access several websites.  With this option enabled, an unlocked database is encrypted and stored locally so that you don't have to re-type your password for each website.  The cache expires automatically after about 40 minutes.</p>
		</div>
		<div class="switch box-bar roomy lighter">
	    <label>
	      <input type="checkbox" v-model="flags.diskCache" 
	      	@click="toggleOnDiskCaching">
	      <span class="lever"></span>
	      Enable On-disk Caching
	    </label>
	  </div>

		<div class="box-bar roomy">
			<h4>Encourage Chrome to emember your passwords</h4>
			<p><a href="https://w3c.github.io/webappsec-credential-management/">Chrome Credential API</a> allows JavaScript to interact in a limited way with the Chrome password manager.  If enabled in the browser, Tusk can use this to encourage Chrome to remember the passwords you use so that they become available in your browser without needing to use Tusk.<br /><br />Chrome also syncs passwords between devices, so they should also become available on your mobile device or other computers.</p>
		</div>
		<div class="switch box-bar roomy lighter">
	    <label>
	      <input type="checkbox" 
	      	v-model="flags.useCredentialApi" 
	      	@click="toggleUseCredentialsApi">
	      <span class="lever"></span>
	      Encourage Chrome to save your credentials when filling them
	    </label>
	  </div>
		
		<div class="box-bar roomy">
			<h4>Stored Data</h4>
			<p>The following objects represent the current data cached in chrome storage.  This data is only available to Tusk, and is never sent over any network connection.</p>
		</div>
		<div class="box-bar between lighter roomy" v-for="blob in blobs">
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
		secureCacheDisk: Object
	},
	data () {
		return {
			busy: false,
			flags: {
				diskCache: false,
				useCredentialApi: false,
			},
			blobs: [
				{
					k: 'databaseUsages', // key
					f: this.settings.getDatabaseUsages, // getter
					delete: {
						f: this.settings.destroyLocalStorage,
						arg: 'databaseUsages',
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
					k: 'defaultRememberOptions', 
					f: this.settings.getDefaultRememberOptions,
					delete: {
						f: this.settings.destroyLocalStorage,
						arg: 'rememberPeriod',
						op: 'Reset'
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
	methods: {
		toggleUseCredentialsApi (event) {
			this.flags.useCredentialApi = !this.flags.useCredentialApi
			this.settings.setUseCredentialApiFlag(this.flags.useCredentialApi)
		},
		toggleOnDiskCaching (event) {
			this.flags.diskCache = !this.flags.diskCache
			this.settings.setDiskCacheFlag(this.flags.diskCache)
	    if (!this.flags.diskCache) {
	      this.secureCacheDisk.clear('entries');
	    }
		},
		init () {
			this.blobs.forEach(blob => {
				blob.f().then(result => {
					if (result && Object.keys(result).length){
						let formatter = new JSONFormatter(result)
						let place = document.getElementById(blob.k)
						while (place.firstChild) place.removeChild(place.firstChild);
						place.appendChild(formatter.render())
					} else {
						document.getElementById(blob.k).parentNode.remove()
					}				
				})
			})

			this.busy = true
			this.settings.getDiskCacheFlag()
			.then(flag => { this.flags.diskCache = flag })
			.then(this.settings.getUseCredentialApiFlag)
			.then(flag => {
				this.flags.useCredentialApi = flag
				this.busy = false
			})
		}
	},
	mounted () {
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