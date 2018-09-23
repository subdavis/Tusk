<template>
	<div id="popup-view">
		<svg-defs></svg-defs>
		<options-navbar :routes="routes" :initial-tab="initialTab"></options-navbar>
		<!-- Router View -->
		<div id="overflowbox">
			<div id="contentbox">
				<options-startup id="/" v-if="show.startup.visible"
					:settings="services.settings"></options-startup>
				<manage-databases id="/manage/databases" v-if="show.manageDatabases.visible" 
					:dropbox-file-manager="services.dropboxFileManager" 
					:google-drive-manager="services.googleDrivePasswordFileManager" 
					:local-file-manager="services.localChromePasswordFileManager"
					:onedrive-manager="services.oneDriveFileManager" 
					:p-cloud-file-manager="services.pCloudFileManager"
					:sample-manager="services.sampleDatabaseFileManager" 
					:shared-url-manager="services.sharedUrlFileManager" 
					:webdav-manager="services.webdavFileManager"
					:settings="services.settings"></manage-databases>
				<manage-keyfiles id="/manage/keyfiles" v-if="show.manageKeyfiles.visible" 
					:settings="services.settings" 
					:key-file-parser="services.keyFileParser"></manage-keyfiles>
				<advanced-settings id="/advanced" v-if="show.advanced.visible" 
					:settings="services.settings" 
					:secure-cache-memory="services.secureCacheMemory"></advanced-settings>
				<reauthorize id="/reauthorize" v-if="show.reauthorize.visible"
					:settings="services.settings"
					:providers="[services.dropboxFileManager,services.googleDrivePasswordFileManager,services.oneDriveFileManager,services.pCloudFileManager]"></reauthorize>
			</div>
		</div>
	</div>
</template>

<script>
/* beautify preserve:start */
// Singletons
import { ChromePromiseApi } from '$lib/chrome-api-promise.js'
import { Settings } from '$services/settings.js'
import { ProtectedMemory } from '$services/protectedMemory.js'
import { SecureCacheMemory } from '$services/secureCacheMemory.js'
import { PasswordFileStoreRegistry } from '$services/passwordFileStore.js'
import { KeyFileParser } from '$services/keyFileParser.js'
// File Managers
import { LocalChromePasswordFileManager } from '$services/localChromePasswordFileManager.js'
import { GoogleDrivePasswordFileManager } from '$services/googleDrivePasswordFileManager.js'
import { DropboxFileManager } from '$services/dropboxFileManager.js'
import { OneDriveFileManager } from '$services/oneDriveFileManager.js'
import { SharedUrlFileManager } from '$services/sharedUrlFileManager.js'
import { PCloudFileManager } from '$services/pCloudFileManager.js'
import { SampleDatabaseFileManager } from '$services/sampleDatabaseFileManager.js'
import { WebdavFileManager } from '$services/webdavFileManager.js'
// Components
import OptionsNavbar from '@/components/Navbar'
import OptionsStartup from '@/components/OptionsStartup'
import ManageDatabases from '@/components/ManageDatabases'
import ManageKeyfiles from '@/components/ManageKeyfiles'
import AdvancedSettings from '@/components/AdvancedSettings'
import SvgDefs from '@/components/SvgDefs'
import Reauthorize from '@/components/Reauthorize'

const protectedMemory = new ProtectedMemory()
const secureCacheMemory = new SecureCacheMemory(protectedMemory)
const settings = new Settings(secureCacheMemory)
const keyFileParser = new KeyFileParser()

// File Managers
const localChromePasswordFileManager = new LocalChromePasswordFileManager()
const dropboxFileManager = new DropboxFileManager(settings)
const googleDrivePasswordFileManager = new GoogleDrivePasswordFileManager(settings)
const sharedUrlFileManager = new SharedUrlFileManager()
const oneDriveFileManager = new OneDriveFileManager(settings)
const pCloudFileManager = new PCloudFileManager(settings)
const sampleDatabaseFileManager = new SampleDatabaseFileManager()
const webdavFileManager = new WebdavFileManager(settings)

const passwordFileStoreRegistry = new PasswordFileStoreRegistry(
	localChromePasswordFileManager,
	dropboxFileManager,
	googleDrivePasswordFileManager,
	sharedUrlFileManager,
	sampleDatabaseFileManager,
	oneDriveFileManager,
	pCloudFileManager)
/* beautify preserve:end */

export default {
	name: 'app',
	components: {
		OptionsNavbar,
		OptionsStartup,
		ManageDatabases,
		ManageKeyfiles,
		AdvancedSettings,
		SvgDefs,
		Reauthorize
	},
	data() {
		return {
			routes: [],
			initialTab: "/", // The tab to start on.
			services: {
				settings,
				dropboxFileManager,
				googleDrivePasswordFileManager,
				localChromePasswordFileManager,
				oneDriveFileManager,
				pCloudFileManager,
				sampleDatabaseFileManager,
				sharedUrlFileManager,
				keyFileParser,
				secureCacheMemory,
				webdavFileManager
			},
			show: {
				startup: {
					visible: false
				},
				manageDatabases: {
					visible: false
				},
				manageKeyfiles: {
					visible: false
				},
				advanced: {
					visble: false
				},
				reauthorize: {
					visible: false
				}
			}
		}
	},
	mounted: function () {
		// Relies on the content of this.show
		this.$router.registerRoutes([{
			route: '/',
			name: "Getting Started",
			var: this.show.startup
		},
		{
			route: '/manage/databases',
			name: "Manage Databases",
			var: this.show.manageDatabases
		},
		{
			route: '/manage/keyfiles',
			name: "Manage Keyfiles",
			var: this.show.manageKeyfiles
		},
		{
			route: '/advanced',
			name: "Advanced",
			var: this.show.advanced
		},
		{
			route: '/reauthorize/:provider',
			name: "Reauthorize",
			var: this.show.reauthorize,
			hidden_from_navbar: true
		}
		])
		this.routes = this.$router.routes // HACK since Vue doesn't notice changes in 
		let hashroute = this.$router.processHash(window.location.hash);
		if (hashroute)
			this.$router.route(hashroute)
		else
			this.$router.route(this.initialTab)
	}
}
</script>

<style lang="scss">
@import "./styles/options.scss";
body {
  background-color: $background-color;
}

#overflowbox {
  overflow-y: auto;
  margin-top: 60px;
}

#contentbox {
  margin: 0px auto;
  width: $options-width;
  /* height: 490px; */
}
</style>
