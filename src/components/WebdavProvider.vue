<!-- 
	SharedLinkProvider:
	Simple http provider that can also handle Dropbox Shared Links
-->
<script>
const Base64 = require('base64-arraybuffer')
import { mapState } from 'vuex'
import { PROVIDER_ENABLED_GET } from '@/store/modules/settings'
import { ChromePromiseApi } from '$lib/chrome-api-promise.js'
import GenericProviderUi from '@/components/GenericProviderUi'
const chromePromise = ChromePromiseApi()

export default {
	data() {
		return {
			busy: false,
			databases: [],
			messages: {
				error: ""
			},
			webdav: {
				username: "",
				url: "",
				password: ""
			},
			busyServers: {},
		}
	},
	components: {
		GenericProviderUi
	},
	props: {
		providerManager: Object,
		settings: Object
	},
	computed: {
		...mapState({
			serverList: (state) => state.auxillary.webdavServerList,
			directoryMap: (state) => state.auxillary.webdavDirectoryMap,
		}),
		loggedIn() {
			return this.$store.getters[PROVIDER_ENABLED_GET](this.providerManager.key)
		},
	},
	asyncComputed: {
		databases: {
			default: [],
			async get() {
				return await this.providerManager.listDatabases();
			},
			watch() {
				this.loggedIn
				this.serverList
				this.directoryMap
			},
		},
	},
	methods: {
		async addServer() {
			try {
				await chromePromise.permissions.request({ origins: [this.webdav.url] });
				const serverInfo = await this.providerManager.addServer(this.webdav.url, this.webdav.username, this.webdav.password);
			} catch (err) {
				console.error(err);
				this.messages.error = err.toString();
			}
		},
		toggleLogin() {
			if (this.loggedIn) {
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
			this.providerManager.listDatabases().then(databases => {
				console.log(databases)
				this.databases = databases
			})
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

<template>
	<div class="box-bar roomy database-manager">
		<generic-provider-ui 
			:busy="busy" 
			:databases="databases" 
			:loggedIn="loggedIn" 
			:error="messages.error"
			:provider-manager="providerManager" 
			@login="toggleLogin" 
			:removeable="false"></generic-provider-ui>
		<div v-if="loggedIn">
			<div class="warn pill">
				<p><b>Wait! </b>Did you read the <a href="https://github.com/subdavis/Tusk/wiki/WebDAV-Support">best practices guide</a>?  Do that first!</p>
			</div>
			<div>
				<p>The URL below should have the path of a FOLDER, not an individual FILE.  
					The webDAV provider works by recursively scanning all files within the folder you specify.  
					Your keepass databases will be discovered by their file extension (.kdbx).</p>
			</div>
			<table v-if="serverList.length">
				<tr>
					<th>User</th>
					<th>URL</th>
					<th>Actions</th>
				</tr>
				<tr v-for="(server, index) in serverList" :key="index">
					<td>{{server.username}}</td>
					<td>{{server.url}}</td>
					<td>
						<a v-show="true" class="selectable" @click="providerManager.searchServer(server.serverId)">
						<i class="fa fa-search"></i> scan</a>
						<a v-show="false"><i class="fa fa-spinner fa-pulse"></i> scanning</a>
					</td>
					<td>
						<a class="selectable" @click="providerManager.removeServer(server.serverId)">
						<i class="fa fa-times-circle selectable"></i> remove</a>
					</td>
				</tr>
			</table>
			<div v-if="loggedIn">
				<p><b>Add new server</b></p>
				<div id="webdav-server-input-box">
					<input id="webdav-server" type="text" v-model="webdav.url" placeholder="http://server:port/remote.php/webdav/">
					<input id="webdav-username" type="text" v-model="webdav.username" placeholder="Username">
					<input id="webdav-password" type="password" v-model="webdav.password" placeholder="Password">	
				</div>
				<a class="waves-effect waves-light btn" @click="addServer">Add server</a>
			</div>	
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import "../styles/settings.scss";

#webdav-server-input-box {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  box-sizing: border-box;

  input {
    padding: 4px;
    margin: 0px 8px 8px 0px;

    &#webdav-server {
      width: 100%;
    }
    &#webdav-username,
    &#webdav-password {
      flex: 1;
    }
  }
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