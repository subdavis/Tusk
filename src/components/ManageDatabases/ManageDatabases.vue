<script>
import { generateSettingsAdapter } from '@/store/modules/settings'
import OauthProvider from '@/components/OauthProvider'
import SharedLinkProvider from '@/components/SharedLinkProvider'
import LocalPasswordFileProvider from '@/components/LocalPasswordFileProvider'
import WebdavProvider from '@/components/WebdavProvider'

const getFileManager = (key, store) => store.state.database.passwordFileStoreRegistry.getFileManager(key)

export default {
	components: {
		OauthProvider,
		SharedLinkProvider,
		LocalPasswordFileProvider,
		WebdavProvider
	},
	data() {
		return {
			// File Managers
			dropboxFileManager: getFileManager('dropbox', this.$store),
			googleDrivePasswordFileManager: getFileManager('gdrive', this.$store),
			localChromePasswordFileManager:	getFileManager('local', this.$store),
			oneDriveFileManager: getFileManager('onedrive', this.$store),
			pCloudFileManager: getFileManager('pcloud', this.$store),
			sampleManager: getFileManager('sample', this.$store),
			sharedUrlFileManager: getFileManager('shared-url', this.$store),
			webdavFileManager: getFileManager('webdav', this.$store),
			settings: generateSettingsAdapter(this.$store),
		}
	},
	mounted() {
		console.log(getFileManager('dropbox', this.$store))
	}
}
</script>

<template lang="pug">
#manage-databases
	.box-bar.about.roomy
		p
			| Tusk
			b  requires
			|	 that you enable at least one of these cloud storage providers to sync your keepass database with. Once the files appear below, they will be available to unlock within the popup window.
		router-link.waves-effect.waves-light.btn(:to="`/manage/databases/help`") Help me choose
		=" "
		router-link.waves-effect.waves-light.btn(:to="`/manage/databases/new`") I haven't made a keepass database yet.
		router-view
	oauth-provider(:provider-manager='dropboxFileManager')
	//- oauth-provider(:provider-manager='googleDriveManager')
	//- oauth-provider(:provider-manager='onedriveManager')
	//- oauth-provider(:provider-manager='pCloudFileManager')
	oauth-provider(:provider-manager='sampleManager')
	//- shared-link-provider(:provider-manager='sharedUrlManager')
	//- webdav-provider(:provider-manager='webdavManager')
	//- local-password-file-provider(:provider-manager='localFileManager')
</template>
