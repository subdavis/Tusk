<template>
  <div>
  	<p>Startup Page Info</p>
  </div>
</template>

<script>
'use strict'
export default {
  props: {
    settings: Object,
    passwordFileStoreRegistry: Object
  },
  data () {
    return {}
  },
  mounted: function () {
    this.settings.getCurrentDatabaseChoice().then(info => {
      //use the last chosen database
      if (info) {
        this.$router.route('/unlock/' + info.providerKey + '/' + encodeURIComponent(info.passwordFile.title));
      } else {
        //user has not yet chosen a database.  Lets see if there are any available to choose...
        var readyPromises = [];
        this.passwordFileStoreRegistry.listFileManagers('listDatabases').forEach(provider => {
          readyPromises.push(provider.listDatabases());
        });

        return Promise.all(readyPromises).then( filesArrays => {
          var availableFiles = filesArrays.reduce((prev, curr) => {
            return prev.concat(curr);
          });

          if (availableFiles.length) {
            //choose one of the files
            this.$router.route('/choose-file')
          } else {
            //no files available - allow the user to link to the options page
            $scope.ready = true;
          }
        });
      }
    })
  }
}
</script>

<style lang="scss">
p {
	width: 100%;
	margin: 10px 0px 0px 0px;
}
</style>