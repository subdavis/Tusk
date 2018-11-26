<script>
import { mapState, mapActions } from 'vuex'
import { Links } from '$services/links'
import { LOCK } from '@/store/modules/database'
export default {
	data: () => ({
		links: new Links(),
		appVersion: chrome.runtime.getManifest().version,
	}),
	computed: {
		...mapState({
			database: 'database',
			busy: (state) => state.database.busy,
			isUnlocked: (state) => !state.database.locked,
		}),
		showFooter() {
			return !busy && this.$router.currentRoute.path 
		},
	},
	methods: {
		...mapActions({
			stateLock: LOCK,
		}),
		lock() {
			this.stateLock()
			const databaseFileName = this.database.active.databaseFileName
			const providerKey = this.database.active.providerKey
			this.$router.push({ path: `/unlock/${providerKey}/${encodeURIComponent(databaseFileName)}` })
		},
		closeWindow(event) {
			window.close()
		},
	},
}
</script>

<template lang="pug">
.footer.box-bar.medium.between(v-show="!busy")
	span.selectable(@click="links.openOptions")
		i.fa.fa-cog(aria-hidden="true")
		|  Settings
	span.selectable(v-if="isUnlocked", @click="lock()")
		i.fa.fa-lock(aria-hidden="true")
		|  Lock Database
	span.selectable(v-else, @click="closeWindow")
		i.fa.fa-times-circle(aria-hidden="true")
		|  Close Window
	span.selectable(@click="links.openHomepage")
		i.fa.fa-info-circle(aria-hidden="true")
		|  v{{ appVersion }}
</template>

<style lang="scss" scoped>
@import "../styles/settings.scss";
.footer span {
  padding: 2px 4px;
  border-radius: 3px;
  &:hover {
    background-color: $dark-background-color;
  }
}
</style>
