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
			<table v-if="serverList.length">
				<tr>
					<th>Server List:</th>
				</tr>
				<tr v-for="(server, index) in serverList">
					<td>{{server.username}}</td>
					<td>{{server.url}}</td>
					<td>
						<a v-show="!server.scanBusy" class="selectable" @click="scan(server.serverId)">
						<i class="fa fa-search"></i> scan</a>
						<a v-show="server.scanBusy"><i class="fa fa-spinner fa-pulse"></i></a>
					</td>
					<td>
						<a class="selectable" @click="remove(server.serverId)">
						<i class="fa fa-times-circle selectable"></i> remove</a>
					</td>
				</tr>
			</table>
			<div class="url-form shared-link-box" v-if="loggedIn">
				
				<input id="webdav-server" type="text" v-model="webdav.url" placeholder="http://server:port/remote.php/webdav/">
				<input id="webdav-username" type="text" v-model="webdav.username" placeholder="Username">
				<input id="webdav-password" type="password" v-model="webdav.password" placeholder="Password">
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
				serverList: [],
				serverListMeta: {}
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
			scan(serverId) {
				let serverListItem = this.serverList.filter(elem => {
					return elem.serverId === serverId
				})[0]
				serverListItem.scanBusy = true

				this.providerManager.searchServer(serverId).then(dirMap => {
					this.providerManager.listDatabases().then(databases => {
						this.databases = databases
					})
				}).then(() => {
					serverListItem.scanBusy = false
				}).catch(err => {
					this.messages.error = err.toString()
					serverListItem.scanBusy = false
				})
			},
			remove(serverId) {
				this.providerManager.removeServer(serverId).then(this.updateServerList)
			},
			updateServerList () {
				this.providerManager.listServers().then(servers => {
					console.log(servers)
					this.serverList = servers
				})
			},
			toggleLogin() {
				if (this.loggedIn) {
					this.settings.disableDatabaseProvider(this.providerManager)
					this.providerManager.logout().then(() => {
						this.loggedIn = false
					})
<<<<<<< HEAD
				} else if (confirm("WebDAV is a beta feature. If you use it, the username and password to the webdav SERVER will be stored on disk.  \n\nTusk will never store you master database password.  \n\nSelect OK to continue.")) {
=======
				} else {
>>>>>>> 87388cd7802ede66d5e87d614d12ba62b989bd58
					this.providerManager.login().then(() => {
						this.loggedIn = true
						this.onLogin()
					})
				}
			},
			onLogin() {
				/* Other things to do when a successful login happens... */
				this.providerManager.listDatabases().then(databases => {
					this.databases = databases
				})
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
		width: 55%;
	}

	.top-padding {
		padding: 20px 0px;
	}

	table {
		font-size: 14px;
		td {
			padding: 5px 5px;
			border-radius: 0px;
		}
		th {
			background-color: $light-background-color;
		} 
		tr {
			background-color: $background-color;
		}
	}
</style>