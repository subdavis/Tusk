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
import { generateSettingsAdapter } from '@/store/modules/settings'
import GenericProviderUi from '@/components/GenericProviderUi'

export default {
	components: {
		GenericProviderUi,
	},
	props: {
		providerManager: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			busy: false,
			databases: [],
			loggedIn: false,
			settings: generateSettingsAdapter(this.$store),
			messages: {
				error: '',
			},
		}
	},
	computed: {
		failed: () => this.messages.error.length > 0,
		busy: () => (this.databases === null && !this.failed),
	},
	asyncComputed: {
		databases: {
			default: null,
			async get(){
				try {
					const databases = await this.providerManager.listDatabases()
					console.log(databases)
					return databases
				} catch (err) {
					console.error("Error while connecting to database backend for", this.providerManager.title)
					this.messages.error = err.message
					throw new Error(err)
				}
			},
			watch() {
				this.loggedIn
			},
		},
		loggedIn: {
			default: false,
			get() { return this.providerManager.isLoggedIn(); },
		},
	},
	methods: {
		toggleLogin(event) {
			//v-bind:id="'toggleButton'+providerManager.key"j
			if (!this.busy) {
				if (this.loggedIn) {
					this.providerManager.logout().then(nil => {
						// if logout works, attempt to unset the currentDatabaseChoice.
						this.settings.disableDatabaseProvider(this.providerManager)
					}).catch(err => {
						this.settings.disableDatabaseProvider(this.providerManager)
						this.messages.error = err.toString()
					})
				} else {
					this.providerManager.login().catch(err => {
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
}
</script>

<template lang="pug">
.box-bar.roomy.database-manager
  generic-provider-ui(
			:busy='busy',
			:databases='databases',
			:loggedin='loggedIn',
			:error='messages.error',
			:provider-manager='providerManager',
			:toggle-login='toggleLogin',
			:removeable='false',
			:remove-function='undefined')
</template>
