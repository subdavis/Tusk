<template>
  <div>
    <!-- Busy Spinner -->
    <div v-if="busy" class="spinner">
      <spinner size="medium" :message="'Starting up...'"></spinner>
    </div>
    <div v-else>
      <div class="box-bar plain">
        <div class="unlockLogo stack-item">
          <img src="../assets/logo.png">
          <span>KeePass Tusk</span>
        </div>
        <p>Tusk is an extension that uses your existing KeePass database files to autofill passwords on websites.  In order to continue, you must add your KeePass database file(s).</p>
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

<script>
import { Links } from '$services/links.js'
import Spinner from 'vue-simple-spinner'

export default {
  props: {
    settings: Object,
    passwordFileStoreRegistry: Object
  },
  data () {
    return {
      links: Links(),
      busy: true
    }
  },
  components: { 
    Spinner
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
            this.$router.route('/choose')
          } else {
            //no files available - allow the user to link to the options page
            this.busy = false;
          }
        });
      }
    })
  }
}
</script>

<style lang="scss">
@import "../styles/settings.scss";
p {
	width: 100%;
	margin: 10px 0px 0px 0px;
  font-size: 14px;
}
</style>