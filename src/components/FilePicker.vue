<script>
import { mapState, mapMutations, mapActions } from 'vuex'
import { ACTIVE_SET, FAIL_GRACEFULLY } from '@/store/modules/database'
import GoBack from '@/components/GoBack'

export default {
	props: {
		links: {
			type: Object,
			required: true,
		},
	},
	components: {
		GoBack,
	},
	data() {
		return {
			databases: [],
		}
	},
	computed: {
		...mapState({
			database: 'database',
		}),
	},
	methods: {
		selectDatabase(i) {
			if (i !== undefined) {
				let database = this.databases[i]
				let info = database.provider.getDatabaseChoiceData(database)
				this.$store.commit(ACTIVE_SET, {
					databaseFileName: database.title,
					providerKey: database.provider.key,
				})
				this.$router.route(`/unlock/${database.provider.key}/${encodeURIComponent(info.title)}`)
			}
		},
	},
	async mounted() {
		const providers = this.database.passwordFileStoreRegistry.listFileManagers('listDatabases');
		for (const i in providers) {
			const provider = providers[i]
			try {
				const databases = await provider.listDatabases()
				if (databases && databases.length) {
					databases.forEach(database => {
						database.provider = provider
					})
					this.databases = this.databases.concat(databases)
				}
			} catch (err) {
				console.error("Error when trying to listDatabases")
				this.$store.dispatch(FAIL_GRACEFULLY, err, provider.key)
			}
		}
	},
}
</script>

<template>
	<div>
		<div v-for="(db, index) in databases" class="box-bar small selectable flair chooseFile" @click="selectDatabase(index)">
			<span>
				<svg class="icon" viewBox="0 0 1 1">
					<use v-bind="{'xlink:href':'#'+db.provider.icon}" />
				</svg> {{ db.title }}
			</span>
		</div>
		<div class="box-bar small selectable flair chooseFile" @click="links.openOptionsDatabases">
			<span>
				<b>Manage Database Files</b>
			</span>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import "../styles/settings.scss";
.chooseFile {
  svg {
    width: 18px;
    vertical-align: middle;
  }
}
</style>