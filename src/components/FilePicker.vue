<template>
  <div>
  	<p>File Picker</p>
  	<p v-for="db in databases">
  		{{db.title}}
  	</p>
  </div>
</template>

<script>
export default {
	props: {
    passwordFileStoreRegistry: Object
	},
  data () {
    return {
    	databases: []
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
</style>