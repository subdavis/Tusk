<template>
	<div>
		<div class="box-bar roomy">
			<h4>Enable on-disk password caching</h4>
			<p>Unless you use the "remember password" option, CKPX can only keep your password file open in-memory for a very brief time, typically about 10 seconds after you close the popup.  This can be frustrating if you have a long password and you need to access several websites.  With this option enabled, an unlocked database is encrypted and stored locally so that you don't have to re-type your password for each website.  The cache expires automatically after about 40 minutes.</p>
		</div>
		<div class="switch box-bar roomy lighter">
	    <label>
	      <input type="checkbox" v-model="diskCachingEnabled" @click="toggleOnDiskCaching">
	      <span class="lever"></span>
	      Enable On-disk Caching
	    </label>
	  </div>

		<div class="box-bar roomy">
			<h4>Encourage Chrome to emember your passwords</h4>
			<p><a href="https://w3c.github.io/webappsec-credential-management/">Chrome Credential API</a> allows JavaScript to interact in a limited way with the Chrome password manager.  If enabled in the browser, CKPX can use this to encourage Chrome to remember the passwords you use so that they become available in your browser without needing to use CKPX.<br /><br />Chrome also syncs passwords between devices, so they should also become available on your mobile device or other computers.</p>
		</div>
		<div class="switch box-bar roomy lighter">
	    <label>
	      <input type="checkbox" v-model="encourageEnabled" @click="toggleEncourage">
	      <span class="lever"></span>
	      Encourage Chrome to save your credentials when filling them
	    </label>
	  </div>
		
		<div class="box-bar roomy">
			<h4>Stored Data</h4>
			<p>The following objects represent the current data cached in chrome storage.  This data is only available to CKPX, and is never sent over any network connection.</p>
		</div>
		<div class="box-bar between lighter roomy" v-for="blob in blobs">
	  	<div class="json" :id="blob.k"></div>
	  	<a class="waves-effect waves-light btn">Remove</a>
	  </div>
	</div>
</template>

<script>
import JSONFormatter from 'json-formatter-js'

export default {
	props: {
		settings: Object
	},
	data () {
		return {
			diskCachingEnabled: false,
			encourageEnabled: false,
			blobs: [
				{k: 'databaseUsages', f: this.settings.getDatabaseUsages},
				{k: 'defaultRememberOptions', f: this.settings.getDefaultRememberOptions},
				{k: 'keyFiles', f: this.settings.getKeyFiles},
				{k: 'license', f: this.settings.getLicense},
				{k: 'forgetTimes', f: this.settings.getAllForgetTimes}
			]
		}
	},
	methods: {
		toggleEncourage () {

		},
		toggleOnDiskCaching () {
			
		}
	},
	mounted () {
		this.blobs.forEach(blob => {
			blob.f().then(result => {
				if (result && Object.keys(result).length){
					let formatter = new JSONFormatter(result)
					document.getElementById(blob.k).appendChild(formatter.render())
				} else {
					document.getElementById(blob.k).parentNode.remove()
				}				
			})
		})
	}
}
/*
 settings.getDiskCacheFlag().then(function(flag) {
    $scope.flags.useDiskCache = flag;
    $scope.$apply();
  });

  settings.getUseCredentialApiFlag().then( flag => {
  	$scope.flags.useCredentialApi = flag;
  	$scope.$apply();
  })

  $scope.updateDiskCacheFlag = function() {
    settings.setDiskCacheFlag($scope.flags.useDiskCache);
    if (!$scope.useDiskCache) {
      secureCacheDisk.clear('entries');
    }
  }

  $scope.updateUseCredentialApiFlag = function() {
  	settings.setUseCredentialApiFlag($scope.flags.useCredentialApi)
  }
*/
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