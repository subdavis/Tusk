<template>
  <div>
  	<div class="box-bar about roomy">
			<p>CKPX requires that you enable at least one of these cloud storage providers to sync your keepass database with.  In order to use CKPX, you must already have the keepass database in your cloud storage provider.</p>
			<a class="waves-effect waves-light btn">Help me choose</a>
			<a class="waves-effect waves-light btn">I haven't made a keepass database yet.</a>
		</div>
		<oauth-provider :provider-manager="dropboxFileManager"></oauth-provider>
		<oauth-provider :provider-manager="googleDriveManager"></oauth-provider>
		<oauth-provider :provider-manager="onedriveManager"></oauth-provider>
  </div>
</template>

<script>
import OauthProvider from '@/components/OauthProvider'
export default {
	props: {
		dropboxFileManager: Object,
		googleDriveManager: Object,
		onedriveManager: Object
	},
	components: {
		OauthProvider
	},
	data () {
		return {}
	},
	mounted () {
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