<template lang="pug">
#router-view
	//- SVG Defs
	svg-defs
	//- Router View
	startup(
			id="/",
			v-if="show.startup.visible",
			:links="services.links")
	file-picker(
			id="/choose",
			v-if="show.filePicker.visible",
			:links="services.links")
	unlock(
			id="/unlock/:provider/:title",
			v-if="show.unlock.visible",
			:links="services.links")
	entry-details(
			id="/entry-details/:entryId",
			v-if="show.entryDetails.visible",
			:links="services.links")
</template>

<script>
// Dependencies
import { Links } from '$services/links.js'
import { generateSettingsAdapter } from '@/store/modules/settings'
import { HYDRATE } from '@/store/modules/database'
// Components
import Unlock from '@/components/Unlock'
import Startup from '@/components/Startup'
import FilePicker from '@/components/FilePicker'
import EntryDetails from '@/components/EntryDetails'
import SvgDefs from '@/components/SvgDefs'

const links = new Links()

export default {
	name: 'app',
	components: {
		Unlock,
		Startup,
		FilePicker,
		EntryDetails,
		SvgDefs
	},
	data() {
		return {
			services: {
				/* The services exposed to UI components */
				settings: generateSettingsAdapter(this.$store),
				links,
			},
			show: {
				unlock: {
					visible: false
				},
				startup: {
					visible: false
				},
				filePicker: {
					visible: false
				},
				entryDetails: {
					visble: false
				}
			}
		}
	},
	async mounted() {
		// Relies on the content of this.show
		this.$router.registerRoutes([
			{
				route: '/',
				var: this.show.startup
			},
			{
				route: '/choose',
				var: this.show.filePicker
			},
			{
				route: '/unlock/:provider/:title',
				var: this.show.unlock
			},
			{
				route: '/entry-details/:entryId',
				var: this.show.entryDetails
			},
		])
		await this.$store.dispatch(HYDRATE)
		this.$router.route('/')
	}
}
</script>

<style lang="scss">
@import "./styles/shared.scss";
#router-view {
  width: 375px;
  margin: 0px;
  color: $text-color;
  background-color: $background-color;
}

body {
  margin: 0px;
  width: 100%;
}
</style>
