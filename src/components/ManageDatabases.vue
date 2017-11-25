<template>
  <div>
		<oauth-provider :provider-manager="dropboxFileManager"></oauth-provider>
		<oauth-provider :provider-manager="googleDriveManager"></oauth-provider>
		<oauth-provider :provider-manager="onedriveManager"></oauth-provider>
		<div class="box-bar roomy about">
			<p>CKPX requires that you enable at least one of these cloud storage providers to sync your keepass database with.</p>
		</div>
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
	background-color: $background-color;
	border-bottom: 0px;
}
</style>