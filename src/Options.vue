<template>
  <div id="main">
    <options-navbar
      :routes="routes"></options-navbar>
    <!-- Router View -->
    <options-startup id="/" v-if="show.startup.visible" class="content-body"
      :settings="services.settings"
      :dropbox-file-manager="services.dropboxFileManager"></options-startup>
    <manage-databases id="/manage/databases" v-if="show.manageDatabases.visible" class="content-body"></manage-databases>
    <manage-keyfiles id="/manage/keyfiles" v-if="show.manageKeyfiles.visible" class="content-body"></manage-keyfiles>
    <advanced-settings id="/advanced" v-if="show.advanced.visible" class="content-body"></advanced-settings>
  </div>
</template>

<script>
// Singletons
import ChromePromiseApi from '$lib/chrome-api-promise.js'
import { Settings } from '$services/settings.js'
import ProtectedMemory from '$services/protectedMemory.js'
import SecureCacheMemory from '$services/secureCacheMemory.js'
import SecureCacheDisk from '$services/secureCacheDisk.js'
import PasswordFileStore from '$services/passwordFileStore.js'
import { KeyFileParser } from '$services/keyFileParser.js'
// File Managers
import { LocalChromePasswordFileManager } from '$services/localChromePasswordFileManager.js'
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

const settings = new Settings()
const protectedMemory = new ProtectedMemory()
const secureCacheMemory = new SecureCacheMemory(protectedMemory)
const secureCacheDisk = new SecureCacheDisk(protectedMemory, secureCacheMemory, settings)
const $q = function(){} // TODO: wtf is this for.

// File Managers
const localChromePasswordFileManager = new LocalChromePasswordFileManager()
const dropboxFileManager = new DropboxFileManager(settings)
const googleDrivePasswordFileManager = new GoogleDrivePasswordFileManager()
const sharedUrlFileManager = new SharedUrlFileManager()
const oneDriveFileManager = new OneDriveFileManager($q, settings)
const sampleDatabaseFileManager = new SampleDatabaseFileManager()

const passwordFileStoreRegistry = new PasswordFileStore(localChromePasswordFileManager, dropboxFileManager, googleDrivePasswordFileManager, sharedUrlFileManager, sampleDatabaseFileManager)

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
      services: {
        settings,
        dropboxFileManager
      },
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
  height: 542px;
}
</style>
