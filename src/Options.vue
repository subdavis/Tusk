<template lang="pug">
#popup-view
	svg-defs
	options-navbar(
			:routes='routes',
			:initial-tab='initialTab')
	#overflowbox
		#contentbox
			router-view
</template>

<script>
import { mapState } from 'vuex'
// Singletons
import { ChromePromiseApi } from '$lib/chrome-api-promise'
// Components
import OptionsNavbar from '@/components/Navbar'
import SvgDefs from '@/components/SvgDefs'
import Reauthorize from '@/components/Reauthorize'

export default {
	name: 'app',
	components: {
		OptionsNavbar,
		SvgDefs,
	},
}
</script>

<style lang="scss">
@import "./styles/shared.scss";
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
}
</style>
