<script>
import OauthProvider from '@/components/OauthProvider.vue'
import SharedLinkProvider from '@/components/SharedLinkProvider.vue'
import LocalPasswordFileProvider from '@/components/LocalPasswordFileProvider.vue'
import WebdavProvider from '@/components/WebdavProvider.vue'
import VirtualRouter from '@/lib/virtual-router.js'

export default {
	props: {
		dropboxFileManager: Object,
		googleDriveManager: Object,
		localFileManager: Object,
		onedriveManager: Object,
		pCloudFileManager: Object,
		sampleManager: Object,
		webdavManager: Object,
		sharedUrlManager: Object,
		settings: Object,
	},
	components: {
		OauthProvider,
		SharedLinkProvider,
		LocalPasswordFileProvider,
		WebdavProvider
	},
	data() {
		return {
			show: {
				help: {
					visible: false
				},
				newUser: {
					visible: false
				},
				none: {
					visible: true
				}
			},
			tabRouter: new VirtualRouter()
		}
	},
	mounted() {
		this.tabRouter.registerRoutes([{
			route: '/help/me/choose',
			var: this.show.help
		},
		{
			route: '/new/user',
			var: this.show.newUser
		},
		{
			route: '/',
			var: this.show.none
		} // Use this to hide others, since no id=none element exists.
		])
	}
}
</script>

<template>
	<div>
		<div class="box-bar about roomy">
			<p>Tusk
				<b>requires</b> that you enable at least one of these cloud storage providers to sync your keepass database with. Once the files appear below, they will be available to unlock within the popup window.</p>

			<a class="waves-effect waves-light btn" @click="tabRouter.route('/help/me/choose')">Help me choose</a>
			<a class="waves-effect waves-light btn" @click="tabRouter.route('/new/user')">I haven't made a keepass database yet.</a>

			<p id="/help/me/choose" v-show="show.help.visible">If you're unsure which to pick, the developers recommend
				<b>Dropbox</b>. It is easy to use and widely supported by other Keepass apps, such as
				<a href="https://play.google.com/store/apps/details?id=keepass2android.keepass2android&hl=en">Keepass2Android</a> for iOS or
				<a href="https://itunes.apple.com/us/app/keepass-touch/id966759076?mt=8">KeepassTouch</a>. Simply create a Dropbox account, upload your keepass database, and enable the dropbox provider below.</p>

			<p id="/new/user" v-show="show.newUser.visible">If you've never used keepass before, you will need to create a new keepass database before enabling the providers below. You can do this by downloading a desktop keepass application like
				<a href="https://keepassxc.org/">KeePassXC</a> or generate one quickly in your browser with
				<a href="https://app.keeweb.info/">KeeWeb</a>. Store the keepass database file in a cloud provider like
				<a href="https://dropbox.com">Dropbox</a> or
				<a href="http://drive.google.com">Google Drive</a> and come back here when you're done.</p>
		</div>
		<oauth-provider :provider-manager="sampleManager" :settings="settings"></oauth-provider>
		<oauth-provider :provider-manager="dropboxFileManager" :settings="settings"></oauth-provider>
		<oauth-provider :provider-manager="googleDriveManager" :settings="settings"></oauth-provider>
		<oauth-provider :provider-manager="onedriveManager" :settings="settings"></oauth-provider>
		<!-- <oauth-provider :provider-manager="pCloudFileManager" :settings="settings"></oauth-provider> -->
		<shared-link-provider :provider-manager="sharedUrlManager" :settings="settings"></shared-link-provider>
		<webdav-provider :provider-manager="webdavManager" :settings="settings"></webdav-provider>
		<local-password-file-provider :provider-manager="localFileManager" :settings="settings"></local-password-file-provider>
	</div>
</template>

<style lang="scss">
@import "../styles/settings.scss";
</style>
