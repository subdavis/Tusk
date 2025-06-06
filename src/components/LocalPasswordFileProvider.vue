<!-- 
	SharedLinkProvider:
	Simple http provider that can also handle Dropbox Shared Links
-->

<script>
import * as Base64 from 'base64-arraybuffer';
import GenericProviderUi from '@/components/GenericProviderUi.vue';

export default {
  components: {
    GenericProviderUi,
  },
  props: {
    providerManager: Object,
    settings: Object,
  },
  data() {
    return {
      busy: false,
      currentUrl: '',
      currentUrlTitle: '',
      databases: [],
      loggedIn: false,
      messages: {
        error: '',
      },
    };
  },
  mounted() {
    this.providerManager.isLoggedIn().then((loggedIn) => {
      this.loggedIn = loggedIn;
    });
    this.providerManager.listDatabases().then((databases) => {
      if (databases !== false) this.databases = databases;
    });
  },
  methods: {
    toggleLogin(e) {
      if (this.loggedIn) {
        this.settings.disableDatabaseProvider(this.providerManager);
        this.providerManager.logout().then(() => {
          this.loggedIn = false;
        });
      } else {
        this.providerManager.login().then(() => {
          this.loggedIn = true;
        });
        e.preventDefault();
      }
    },
    selectFile(event) {
      document.getElementById('file-selector').click();
    },
    removePasswordFile(index) {
      if (index >= this.databases.length || index < 0) return; // not a valid index...
      let fi = this.databases[index];
      this.providerManager
        .deleteDatabase(fi)
        .then(this.providerManager.listDatabases)
        .then((files) => {
          this.databases = files;
        });
    },
    handleAdd(event) {
      let files = event.target.files;
      this.messages.error = '';
      for (var i = 0; i < files.length; i++) {
        let reader = new FileReader();
        let fp = files[i];
        reader.readAsArrayBuffer(fp);
        reader.onload = (e) => {
          if (fp.name.indexOf('.kdbx') < 0 || fp.size < 70) {
            this.messages.error += fp.name + ' is not a valid KeePass v2+ file. ';
            return;
          }

          var fi = {
            title: fp.name,
            lastModified: fp.lastModified,
            lastModifiedDate: fp.lastModifiedDate,
            size: fp.size,
            type: fp.type,
            data: Base64.encode(e.target.result),
          };

          var existingIndex = null;
          this.databases.forEach(function (existingFile, index) {
            if (existingFile.title == fi.title) existingIndex = index;
          });

          if (existingIndex == null) {
            //add
            this.databases.push(fi);
          } else {
            //replace
            this.databases[existingIndex] = fi;
          }

          return this.providerManager.saveDatabase({
            title: fi.title,
            data: fi.data,
            lastModified: fi.lastModified,
          });
        }; // end onload
      }
    },
  },
};
</script>

<template>
  <div class="box-bar roomy database-manager">
    <generic-provider-ui
      :busy="busy"
      :databases="databases"
      :logged-in="loggedIn"
      :error="messages.error"
      :provider-manager="providerManager"
      :toggle-login="toggleLogin"
      :removeable="true"
      :remove-function="removePasswordFile"
    />
    <div v-if="loggedIn">
      <div class="warn pill">
        <p>
          Tusk
          <b>cannot</b> keep your local database file up to date.
          <b>If you change it, you'll have to import it into Tusk again.</b>
        </p>
      </div>
      <div>
        <input
          id="file-selector"
          type="file"
          accept=".kdbx"
          style="display: none"
          name="file"
          multiple
          @change="handleAdd"
        />
        <a class="waves-effect waves-light btn" @click="selectFile">Select Local File</a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/settings.scss';
</style>
