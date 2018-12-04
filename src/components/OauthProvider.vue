<!-- 
	OauthProvider:
	Database Provider for database managers that implement the oauth interface:
	The providerManager implements the following:
		* login() -> promise
		* logout() -> promise
		* listDatabases() -> promise(Array)
		* isLoggedIn() -> boolean
	It also has properties:
		* title
		* key
-->
<script>
import { PROVIDER_ENABLED_GET } from '@/store/modules/settings'
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
			messages: {
				error: '',
			},
		}
	},
	computed: {
		failed() {
			return this.messages.error.length > 0
		},
		busy() {
			return this.databases === null && !this.failed
		},
		loggedIn() {
			return this.$store.getters[PROVIDER_ENABLED_GET](this.providerManager.key)
		}
	},
	asyncComputed: {
		databases: {
			default: null,
			async get(){
				try {
					return await this.providerManager.listDatabases()
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
	},
	methods: {
		toggleLogin(event) {
			if (!this.busy) {
				if (this.loggedIn) {
					this.providerManager.logout().catch(err => {
						this.messages.error = err.toString()
					})
				} else {
					this.providerManager.login().catch(err => {
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
			:busy="busy",
			:databases='databases',
			:logged-in='loggedIn',
			:error='messages.error',
			:provider-manager='providerManager',
			@login='toggleLogin',
			:removeable='false')
</template>
