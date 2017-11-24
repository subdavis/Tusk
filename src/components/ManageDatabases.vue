<template>
  <div>
  		<oauth-provider :provider-manager="dropboxFileManager"></oauth-provider>
  </div>
</template>

<script>
import OauthProvider from '@/components/OauthProvider'
export default {
	props: {
		dropboxFileManager: Object
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
</style>