<template>
  <div id="main">
    <options-navbar :routes="routes"></options-navbar>
    <!-- Router View -->
    <options-startup id="/" v-if="show.startup.visible"></options-startup>
    <manage-databases id="/manage/databases" v-if="show.manageDatabases.visible"></manage-databases>
    <manage-keyfiles id="/manage/keyfiles" v-if="show.manageKeyfiles.visible"></manage-keyfiles>
    <advanced-settings id="/advanced" v-if="show.advanced.visible"></advanced-settings>
  </div>
</template>

<script>
// Singletons
import ChromePromiseApi from '$lib/chrome-api-promise.js'
import { Settings } from '$services/settings.js'
import ProtectedMemory from '$services/protectedMemory.js'
import { KeepassHeader } from '$services/keepassHeader.js'
import KeepassReference from '$services/keepassReference.js'
import { KeepassService } from '$services/keepassService.js'
import UnlockedState from '$services/unlockedState.js'
import SecureCacheMemory from '$services/secureCacheMemory.js'
import SecureCacheDisk from '$services/secureCacheDisk.js'
import PasswordFileStore from '$services/passwordFileStore.js'
import { KeyFileParser } from '$services/keyFileParser.js'
// File Managers
import LocalChromePasswordFileManager from '$services/localChromePasswordFileManager.js'
import { GoogleDrivePasswordFileManager } from '$services/googleDrivePasswordFileManager.js'
import { DropboxFileManager } from '$services/dropboxFileManager.js'
import { OneDriveFileManager } from '$services/oneDriveFileManager.js'
import { SharedUrlFileManager } from '$services/sharedUrlFileManager.js'
import { SampleDatabaseFileManager } from '$services/sampleDatabaseFileManager.js'
// Components
import OptionsNavbar from '@/components/Navbar'
import OptionsStartup from '@/components/OptionsStartup'
import ManageDatabases from '@/components/ManageDatabases'
import ManageKeyfiles from '@/components/ManageKeyfiles'
import AdvancedSettings from '@/components/AdvancedSettings'

export default {
  name: 'app',
  components: {
    OptionsNavbar,
    OptionsStartup,
    ManageDatabases,
    ManageKeyfiles,
    AdvancedSettings
  },
  data () {
    return {
      routes: [],
      show: {
        startup: { visible: false },
        manageDatabases: { visible: false },
        manageKeyfiles: { visible: false },
        advanced: { visble: false }
      }
    }
  },
  mounted: function () {
    // Relies on the content of this.show
    this.$router.registerRoutes([
      { 
        route: '/', 
        name: "Getting Started",
        var: this.show.startup 
      },
      { 
        route: '/manage/databases', 
        name: "Manage Databases",
        var: this.show.manageDatabases 
      },
      { 
        route: '/manage/keyfiles', 
        name: "Manage Keyfiles",
        var: this.show.manageKeyfiles 
      },
      { 
        route: '/advanced', 
        name: "Advanced",
        var: this.show.advanced 
      }
    ])
    this.routes = this.$router.routes // HACK since Vue doesn't notice changes in 
    this.$router.route('/')
  }
}
</script>

<style lang="scss">
@import './styles/options.scss';

#main {
  width: 800px;
  height: 520px;
}
</style>
