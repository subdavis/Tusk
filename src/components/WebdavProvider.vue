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
			:removeable="false"></generic-provider-ui>
		<div class="top-padding" v-if="loggedIn">
			<table>
				<tr>
					<th>Server List:</th>
				</tr>
				<tr v-for="(server, index) in serverList">
					<td>{{server.username}}</td>
					<td>{{server.url}}</td>
					<td><a @click="scan">re-scan</a></td>
					<td><a @click="remove(server.serverId)">remove</a></td>
				</tr>
			</table>
			<div class="url-form shared-link-box" v-if="loggedIn">
				
				<input id="webdav-server" type="text" v-model="webdav.url" placeholder="http://server:port/remote.php/webdav/">
				<input id="webdav-username" type="text" v-model="webdav.username" placeholder="Username">
				<input id="webdav-password" type="text" v-model="webdav.password" placeholder="Password">
				<a class="waves-effect waves-light btn" @click="addServer">Add server</a>
			</div>
		</div>
	</div>
</template>

<script>
	const Base64 = require('base64-arraybuffer')
	import {ChromePromiseApi} from '$lib/chrome-api-promise.js'
	import GenericProviderUi from '@/components/GenericProviderUi'
	const chromePromise = ChromePromiseApi()

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
				chromePromise.permissions.request({
					origins: [this.webdav.url] //FLAGHERE TODO
				}).then(() => {
					this.providerManager.addServer(this.webdav.url, this.webdav.username, this.webdav.password).then(success => {
						// do somethings
						this.updateServerList()
					}).catch(err => {
						console.error(err)
						this.messages.error = err.toString()
					})
				}).catch(err => {
					console.error(err)
					this.messages.error = err.toString()
				})
			},
			scan() {
				this.providerManager.listDatabases().then(databases => {
					this.databases = databases
				})
			},
			remove(serverId) {
				this.providerManager.removeServer(serverId)
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
						this.onLogin()
					})
				}
			},
			onLogin() {
				/* Other things to do when a successful login happens... */
				this.scan()
				this.updateServerList()
			}
		},
		mounted() {
			this.providerManager.isLoggedIn().then(loggedIn => {
				this.loggedIn = loggedIn
				if (loggedIn) this.onLogin();
			})
		}
	}
</script>

<style lang="scss">
	@import "../styles/settings.scss";

	input#webdav-server {
		width: 45%;
	}

	.top-padding {
		padding: 20px 0px;
	}
</style>