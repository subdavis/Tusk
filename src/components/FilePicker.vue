<template>
  <div>
  	<div v-for="(db, index) in databases" class="box-bar small selectable flair chooseFile" @click="selectDatabase(index)">
      <span>
        <svg class="icon" viewBox="0 0 1 1">
          <use v-bind="{'xlink:href':'#'+db.provider.icon}"/>
        </svg> {{ db.title }}
      </span> 
    </div>
    <div class="box-bar small selectable flair chooseFile" @click="links.openOptions">
      <span>Manage Database Files</span>
    </div>
  </div>
</template>

<script>
import GoBack from '@/components/GoBack'

export default {
	props: {
    passwordFileStoreRegistry: Object,
    settings: Object,
    links: Object
	},
  components: {
    GoBack
  },
  data () {
    return {
    	databases: []
    }
  },
  methods: {
    selectDatabase (i) {
      if (i !== undefined){
        let database = this.databases[i]
        let info = database.provider.getDatabaseChoiceData(database);
        this.settings.saveCurrentDatabaseChoice(info, database.provider).then(nil => {
          this.$router.route('/unlock/' + database.provider.key + '/' + encodeURIComponent(database.title))
        })
      } else {
        // TODO
      }
    }
  },
  mounted () {
  	this.passwordFileStoreRegistry.listFileManagers('listDatabases').forEach(provider => {
	    provider.listDatabases().then(databases => {
	    	if (databases && databases.length) {
		      databases.forEach(database => {
		        database.provider = provider
		      })
		      this.databases = this.databases.concat(databases)
	    	}
	    })
  	})
  }
}
</script>

<style lang="scss">
@import "../styles/settings.scss";

.chooseFile {
  svg {
    width: 18px;
    vertical-align: middle;
  }
}
</style>