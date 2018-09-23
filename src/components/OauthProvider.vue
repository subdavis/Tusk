<!-- 
	OauthProvider:
	Database Provider for database managers that implement the oauth interface:
		/* The providerManager implements the following methods that return promises:
		 * isLoggedIn()
		 * login()
		 * logout()
		 * listDatabases()
		 */
	If new providers are added, prefer that they are oauth providers.
-->
<script>
import GenericProviderUi from '@/components/GenericProviderUi'

export default {
	data() {
		return {
			busy: false,
			databases: [],
			loggedIn: false,
			messages: {
				error: ""
			}
		}
	},
	components: {
		GenericProviderUi
	},
	props: {
		providerManager: Object,
		settings: Object
	},
	methods: {
		populate() {
			// TODO: deal with the race condition here....
			this.busy = true
			this.messages.error = ""
			this.providerManager.listDatabases().then(databases => {
				this.databases = databases
				this.providerManager.isLoggedIn().then(loggedIn => {
					this.loggedIn = loggedIn
					this.busy = false
				})
			}).catch(err => {
				console.error("Error while connecting to database backend for", this.providerManager.title)
				this.messages.error = err.toString()
				this.databases = []
				console.error(err)
				this.busy = false
			})
		},
		toggleLogin(event) {
			//v-bind:id="'toggleButton'+providerManager.key"j
			if (!this.busy) {
				if (this.loggedIn) {
					this.providerManager.logout().then(nil => {
						// if logout works, attempt to unset the currentDatabaseChoice.
						this.settings.disableDatabaseProvider(this.providerManager)
						this.populate()
					}).catch(err => {
						this.settings.disableDatabaseProvider(this.providerManager)
						this.messages.error = err.toString()
					})
				} else {
					this.providerManager.login().then(nil => {
						this.populate()
					}).catch(err => {
						this.loggedIn = false
						this.messages.error = err.toString()
					})
				}
			} else {
				// wait for state to settle...
				console.error("Wait for toggle state to settle before changing enable/disable")
			}
		}
	},
	mounted() {
		this.populate()
	}
}
</script>

<template>
	<div class="box-bar roomy database-manager">
		<generic-provider-ui :busy="busy" :databases="databases" :loggedIn="loggedIn" :error="messages.error" :provider-manager="providerManager" :toggle-login="toggleLogin" :removeable="false" :remove-function="undefined"></generic-provider-ui>
	</div>
</template>

<style lang="scss">
@import "../styles/settings.scss";
</style>