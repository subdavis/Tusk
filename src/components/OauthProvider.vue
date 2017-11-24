<template>
  <div class="box-bar plain">
  	<div class="switch">
	    <label>
	      Disabled
	      <input type="checkbox">
	      <span class="lever"></span>
	    </label>
	  </div>
  </div>
</template>

<script>
export default {
	data () {
		return {
			busy: false,
			databases: [],
			loggedIn: false
		}
	},
	props: {
		/* The providerManager implements the following that return promises...
		 * isLoggedIn()
		 * login()
		 * logout()
		 * listDatabases()
		 */
		providerManager: Object 
	},
	methods: {
		login () {

		},
		logout () {

		},
		populate () {
			this.busy = true
			this.providerManager.listDatabases().then(databases => {
				this.databases = databases
				this.busy = false
			}).catch(err => {
				console.error(err)
				this.busy = false
			})
		}
	},
	mounted () {
		this.busy = true
		this.providerManager.isLoggedIn(loggedIn => {
			this.loggedIn = loggedIn
			if (loggedIn)
				this.populate()
			else
				this.busy = false
		});
	}
}
</script>

<style lang="scss">
@import "../styles/settings.scss";
</style>