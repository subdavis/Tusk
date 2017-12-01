<template>
	<div>
		<div class="box-bar roomy">
			<h4>Enable on-disk password caching</h4>
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
			blobs: [
				{k: 'databaseUsages', f: this.settings.getDatabaseUsages},
				{k: 'defaultRememberOptions', f: this.settings.getDefaultRememberOptions},
				{k: 'keyFiles', f: this.settings.getKeyFiles},
				{k: 'license', f: this.settings.getLicense},
				{k: 'forgetTimes', f: this.settings.getAllForgetTimes}
			]
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