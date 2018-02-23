<!-- 
	SharedLinkProvider:
	Simple http provider that can also handle Dropbox Shared Links
-->
<template>
	<div class="box-bar roomy database-manager">
		<generic-provider-ui 
			:busy="busy" 
			:databases="databases" 
			:loggedIn="loggedIn" 
			:error="messages.error" 
			:provider-manager="providerManager" 
			:toggle-login="toggleLogin" 
			:removeable="true"></generic-provider-ui>
		<div class="top-padding" v-if="loggedIn">
			<div>
				<span>Server List:</span>
				<span v-for="(server, index) in serverList" class="chip">
					{{ server.username }}@{{ server.url }}
				</span>
			</div>
			<div class="url-form shared-link-box" v-if="loggedIn">
				
				<input id="webdav-server" type="text" v-model="webdav.url" placeholder="http://server:port/remote.php/webdav/">
				<input id="webdav-username" type="text" v-model="webdav.username" placeholder="Username">
				<input id="webdav-password" type="text" v-model="webdav.password" placeholder="Password">
				<a class="waves-effect waves-light btn" @click="addServer">Add URL Source</a>
			</div>
		</div>
	</div>
</template>

<script>
	const Base64 = require('base64-arraybuffer')
	import GenericProviderUi from '@/components/GenericProviderUi'

	export default {
		data() {
			return {
				busy: false,
				databases: [],
				loggedIn: false,
				messages: {
					error: ""
				},
				webdav: {
					username: "",
					url:"",
					password:""
				},
				serverList: []
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
			addServer() {
				this.providerManager.addServer(this.webdav.url, this.webdav.username, this.webdav.password).then(success => {
					// do somethings
					this.updateServerList()
				}).catch(err => {
					console.error(err)
					this.messages.error = err.toString()
				})
			},
			updateServerList () {
				this.providerManager.listServers().then(servers => {
					this.serverList = servers
					console.log(servers)
				})
			},
			toggleLogin() {
				if (this.loggedIn) {
					this.settings.disableDatabaseProvider(this.providerManager)
					this.providerManager.logout().then(() => {
						this.loggedIn = false
					})
				} else {
					this.providerManager.login().then(() => {
						this.loggedIn = true
					})
				}
			}
		},
		mounted() {
			this.updateServerList()
			this.providerManager.isLoggedIn().then(loggedIn => {
				this.loggedIn = loggedIn
			})
			// this.providerManager.listDatabases().then(databases => {
			// 	if (databases !== false)
			// 		this.databases = databases
			// })
		}
	}
</script>

<style lang="scss">
	@import "../styles/settings.scss";

	input#webdav-server {
		width: 45%;
	}

	.top-padding {
		padding: 20px;
	}
</style>