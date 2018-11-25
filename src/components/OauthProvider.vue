<!-- 
	OauthProvider:
	Database Provider for database managers that implement the oauth interface:
		/* The providerManager implements the following methods that return promises:
		 * isLoggedIn()
		 * login()
		 * logout()
		 * listDatabases()
     * 
		 * It also has the following properties:
		 * title
		 */
	If new providers are added, prefer that they are oauth providers.
-->
<script>
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
		},
		loggedIn: {
			default: false,
			async get() { 
				const is = await this.providerManager.isLoggedIn();
				return is;
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
			:busy='busy',
			:databases='databases',
			:logged-in='loggedIn',
			:error='messages.error',
			:provider-manager='providerManager',
			:toggle-login='toggleLogin',
			:removeable='false',
			:remove-function='undefined')
</template>
