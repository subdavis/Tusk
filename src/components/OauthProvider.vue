<template>
  <div class="box-bar roomy database-manager">
  	<div class="between">
	  	<div class="title">{{ providerManager.title }}</div>
	  	<div>
	  		<div class="switch">
			    <label>
			      Disabled
			      <input type="checkbox" v-model="loggedIn">
			      <span class="lever"></span>
			      Enabled
			    </label>
			  </div>
			</div>
		</div>
		<div v-for="db in databases" class="chip">{{ db.title }}</div>
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
	watch: {
		loggedIn: function (newLoggedIn){

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
		populate () {
			this.busy = true
			this.providerManager.listDatabases().then(databases => {
				this.databases = databases
				this.loggedIn = true
				this.busy = false
			}).catch(err => {
				console.error(err)
				this.busy = false
			})
		}
	},
	mounted () {
		this.populate()
	}
}
</script>

<style lang="scss">
@import "../styles/settings.scss";
.database-manager {
	background-color: $light-background-color;
}
.chip {
	height: 24px;
	line-height: 24px;
	font-size: 11px;
}
</style>