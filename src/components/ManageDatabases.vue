<template>
  <div>
  	<div class="box-bar about roomy">
			<p>CKPX <b>requires</b> that you enable at least one of these cloud storage providers to sync your keepass database with.  Once the files appear below, they will be available to unlock within the popup window.</p>
			
			<a class="waves-effect waves-light btn" @click="tabRouter.route('/help/me/choose')">Help me choose</a>
			<a class="waves-effect waves-light btn" @click="tabRouter.route('/new/user')">I haven't made a keepass database yet.</a>

			<p id="/help/me/choose" v-show="show.help.visible">If you're unsure which to pick, the developers recommend <b>Dropbox</b>. It is easy to use and widely supported by other Keepass apps, such as <a href="https://play.google.com/store/apps/details?id=keepass2android.keepass2android&hl=en">Keepass2Android</a> for iOS or <a href="https://itunes.apple.com/us/app/keepass-touch/id966759076?mt=8">KeepassTouch</a>.</p>
			
			<p id="/new/user" v-show="show.newUser.visible">If you've never used keepass before, you will be prompted to create a new database when you open the popup window <i>after</i> you enable one of the cloud providers below. Most people keep all their passwords in a single database, so you should only need to do this once.</p>
		</div>
		<oauth-provider :provider-manager="dropboxFileManager"></oauth-provider>
		<oauth-provider :provider-manager="googleDriveManager"></oauth-provider>
		<oauth-provider :provider-manager="onedriveManager"></oauth-provider>
		<oauth-provider :provider-manager="sampleManager"></oauth-provider>
  </div>
</template>

<script>
import OauthProvider from '@/components/OauthProvider'
import VirtualRouter from '$lib/virtual-router.js'
export default {
	props: {
		dropboxFileManager: Object,
		googleDriveManager: Object,
		onedriveManager: Object,
		sampleManager: Object
	},
	components: {
		OauthProvider
	},
	data () {
		return {
			show: {
				help: { visible: false },
				newUser: { visible: false },
				none: { visible: true }
			},
			tabRouter: new VirtualRouter()
		}
	},
	mounted () {
		 this.tabRouter.registerRoutes([
      { route: '/help/me/choose', var: this.show.help },
      { route: '/new/user', var: this.show.newUser },
      { route: '/', var: this.show.none } // Use this to hide others
    ])
	}
}
</script>

<style lang="scss">
@import "../styles/settings.scss";

.switch label input[type=checkbox]:checked + .lever {
	background-color: $green;
	&:after {
		background-color: $light-green;
	}	
}

div.about {
}
</style>