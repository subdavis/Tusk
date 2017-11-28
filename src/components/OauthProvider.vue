<template>
  <div class="box-bar roomy database-manager">
  	<div class="between">
	  	<div class="title">
	  		<span><svg class="icon" viewBox="0 0 1 1"><use v-bind="{'xlink:href':'#'+providerManager.icon}"/></svg> {{ providerManager.chooseTitle }}</span>
	  		<span v-for="db in databases" class="chip">{{ db.title }}</span>
	  	</div>
	  	<div>
	  		<div class="switch">
			    <label>
			      {{ busy ? 'busy' : (loggedIn ? 'Enabled' : 'Disabled') }}
			      <input :disabled="busy" type="checkbox" v-model="loggedIn" @click="toggleLogin">
			      <span class="lever"></span>
			    </label>
			  </div>
			</div>
			<!-- <spinner v-else size="medium"></spinner> -->
		</div>
		<div class="description">{{ providerManager.chooseDescription }}</div>
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
			// TODO: deal with the race condition here....
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
			if (!this.busy){
				if (this.loggedIn){
					this.providerManager.logout().then(nil => {
						this.populate()
					})
				} else {
					this.providerManager.login().then(nil => {
						this.populate()
					})
				}
			} else {
				// wait for state to settle...
				console.error("Wait for toggle state to settle before changing enable/disable")
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

	svg {
    width: 18px;
    vertical-align: middle;
  }
  .chip {
		height: 24px;
		line-height: 24px;
		font-size: 11px;
	}
	.description {
		font-size: 12px;
		font-color: $dark-background-color;
	}
	.switch {
		min-width: 120px;
	}
	.between {
		line-height: 36px;
	}
}
</style>