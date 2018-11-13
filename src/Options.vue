<template lang="pug">
#popup-view
	svg-defs
	options-navbar(
			:routes='routes',
			:initial-tab='initialTab')

	#overflowbox
		#contentbox
			options-startup(
					id='/',
					v-if='show.startup.visible',
					:settings='settings')
			manage-databases(
					id='/manage/databases',
					v-if='show.manageDatabases.visible',
					:dropbox-file-manager='services.dropboxFileManager',
					:google-drive-manager='services.googleDrivePasswordFileManager',
					:local-file-manager='services.localChromePasswordFileManager',
					:onedrive-manager='services.oneDriveFileManager',
					:p-cloud-file-manager='services.pCloudFileManager',
					:sample-manager='services.sampleDatabaseFileManager',
					:shared-url-manager='services.sharedUrlFileManager',
					:webdav-manager='services.webdavFileManager',
					:settings='settings')
			manage-keyfiles(
					id='/manage/keyfiles',
					v-if='show.manageKeyfiles.visible',
					:settings='settings',
					:key-file-parser='services.keyFileParser')
			advanced-settings(
					id='/advanced',
					v-if='show.advanced.visible',
					:settings='settings')
			reauthorize(
					id='/reauthorize',
					v-if='show.reauthorize.visible',
					:settings='settings',
					:providers='[services.dropboxFileManager,services.googleDrivePasswordFileManager,services.oneDriveFileManager,services.pCloudFileManager]')
</template>

<script>
import { mapState } from 'vuex'
// Singletons
import { ChromePromiseApi } from '$lib/chrome-api-promise'
import { generateSettingsAdapter } from '@/store/modules/settings'
import { KeyFileParser } from '$services/keyFileParser.js'
// Components
import OptionsNavbar from '@/components/Navbar'
import OptionsStartup from '@/components/OptionsStartup'
import ManageDatabases from '@/components/ManageDatabases'
import ManageKeyfiles from '@/components/ManageKeyfiles'
import AdvancedSettings from '@/components/AdvancedSettings'
import SvgDefs from '@/components/SvgDefs'
import Reauthorize from '@/components/Reauthorize'

const keyFileParser = new KeyFileParser()
const getFileManager = (key, store) => store.state.database.passwordFileStoreRegistry.getFileManager(key)

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
	computed: {
		...mapState({

			settings: 'settings',
		}),
	},
	data() {
		return {
			routes: [],
			initialTab: "/", // The tab to start on.
			services: {
				settings: generateSettingsAdapter(this.$store),
				keyFileParser,
				// File Managers,
				dropboxFileManager: getFileManager('dropbox', this.$store),
				googleDrivePasswordFileManager: getFileManager('gdrive', this.$store),
				localChromePasswordFileManager:  getFileManager('local', this.$store),
				oneDriveFileManager: getFileManager('onedrive', this.$store),
				pCloudFileManager: getFileManager('pcloud', this.$store),
				sampleDatabaseFileManager: getFileManager('sample', this.$store),
				sharedUrlFileManager: getFileManager('shared-url', this.$store),
				webdavFileManager: getFileManager('webdav', this.$store),
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
