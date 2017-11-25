<template>
  <div class="box-bar roomy database-manager">
  	<div class="between">
	  	<div class="title">{{ providerManager.title }}</div>
	  	<div v-if="!busy">
	  		<div class="switch">
			    <label>
			      {{ loggedIn ? 'Enabled' : 'Disabled' }}
			      <input type="checkbox" v-model="loggedIn" @click="toggleLogin">
			      <span class="lever"></span>
			    </label>
			  </div>
			</div>
			<spinner v-else size="medium" message="Loading..."></spinner>
		</div>
		<div v-for="db in databases" class="chip">{{ db.title }}</div>
  </div>
</template>

<script>
import Spinner from 'vue-simple-spinner'

export default {
	data () {
		return {
			busy: false,
			databases: [],
			loggedIn: false
		}
	},
	components: {
		Spinner
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
				this.providerManager.isLoggedIn().then(loggedIn => {
					this.loggedIn = loggedIn
					this.busy = false
				})
			}).catch(err => {
				console.error(err)
				this.busy = false
			})
		},
		toggleLogin (event) {
			// A click means the state is settled...
			this.busy = true
			if (this.loggedIn){
				this.providerManager.logout().then(nil => {
					this.populate()
				})
			} else {
				this.providerManager.login().then(nil => {
					this.populate()
				})
			}
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