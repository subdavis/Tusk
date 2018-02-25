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
			<div class="warning-box">
				<p>Wait! Stop!  Did you read the <a href="https://github.com/subdavis/Tusk/wiki/WebDAV-Support">best practices guide</a>?  Do that first!</p>
			</div>
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
						<a v-show="server.scanBusy"><i class="fa fa-spinner fa-pulse"></i> scanning</a>
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
					this.providerManager.addServer(this.webdav.url, this.webdav.username, this.webdav.password).then(serverInfo => {
						// do somethings
						return this.updateServerList().then(() => {
							this.scan(serverInfo.serverId)
						})
					}).catch(err => {
						console.error(err)
						this.messages.error = err.toString()
					})
				}).catch(err => {
					console.error(err)
					this.messages.error = err.toString()
				})
			},
			setBusy(serverId, busy){
				let serverListItem = this.serverList.filter(elem => {
					return elem.serverId === serverId
				})[0]
				serverListItem.scanBusy = busy
			},
			scan(serverId) {
				this.setBusy(serverId, true)
				return this.providerManager.searchServer(serverId).then(dirMap => {
					this.providerManager.listDatabases().then(databases => {
						this.databases = databases
					})
				}).catch(err => {
					this.messages.error = err.toString()
				}).then(() => {
					// READ: finally.
					this.setBusy(serverId, false)
				})
			},
			remove(serverId) {
				return this.providerManager.removeServer(serverId).then(this.updateServerList)
			},
			updateServerList () {
				return this.providerManager.listServers().then(servers => {
					this.serverList = servers
				})
			},
			toggleLogin() {
				if (this.loggedIn) {
					this.settings.disableDatabaseProvider(this.providerManager)
					this.providerManager.logout().then(() => {
						this.loggedIn = false
					})
				} else if (confirm("WebDAV is a beta feature. If you use it, the username and password to the webdav SERVER will be stored on disk.  \n\nTusk will never store you master database password.  \n\nSelect OK to continue.")) {
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

	.warning-box {
		p {
			margin: 4px;
		}
		border: 3px solid red;
	}
</style>