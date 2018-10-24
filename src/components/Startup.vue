<script>
/* beautify preserve:start */
import { mapState, mapMutations, mapActions } from 'vuex'
import Spinner from 'vue-simple-spinner'
import { Links } from '$services/links.js'
/* beautify preserve:end */
export default {
	data() {
		return {
			links: Links(),
			busy: true
		}
	},
	components: {
		Spinner
	},
	computed: {
		...mapState({
			database: 'database',
		}),
	},
	async mounted() {
		const databaseFileName = this.database.active.databaseFileName
		const providerKey = this.database.active.providerKey

		if (databaseFileName && providerKey) {
			this.$router.route(`/unlock/${providerKey}/${encodeURIComponent(databaseFileName)}`)
		}

		const readyPromises = [];
		const managers = this.database.passwordFileStoreRegistry.listFileManagers('listDatabases').forEach(provider => {
			readyPromises.push(provider.listDatabases())
		})
		const filesArrays = await Promise.all(readyPromises)
		const availableFiles = filesArrays.reduce((prev, curr) => {
			return prev.concat(curr);
		})
		if (availableFiles.length) {
			this.$router.route('/choose')
		} else {
			this.busy = false
		}
	}
}
</script>

<template>
	<div>
		<!-- Busy Spinner -->
		<div v-if="busy" class="box-bar plain spinner">
			<spinner size="medium" :message="'Starting up...'"></spinner>
		</div>
		<div v-else>
			<div class="box-bar plain">
				<div class="unlockLogo stack-item">
					<img src="assets/icons/exported/128x128.svg">
					<span>KeePass Tusk</span>
				</div>
				<p>Tusk is an extension that uses your existing KeePass database files to autofill passwords on websites. In order to continue, you must add your KeePass database file(s).</p>
			</div>
			<div class="stack-item selectable">
				<button class="action-button selectable" v-on:click="links.openOptions">Add a KeePass database file</button>
			</div>
			<div class="box-bar plain">
				<p>You can return here when you've enabled one of the database file providers.</p>
			</div>
		</div>
	</div>
</template>

<style lang="scss">
@import "../styles/settings.scss";
p {
  width: 100%;
  margin: 10px 0px 0px 0px;
  font-size: 14px;
}
</style>