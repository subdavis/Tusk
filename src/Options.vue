<template>
  <div id="main">
    <svg-defs></svg-defs>
    <options-navbar
      :routes="routes"
      :initial-tab="initialTab"></options-navbar>
    <!-- Router View -->
    <div id="overflowbox">
      <div id="contentbox">
        <options-startup id="/" v-if="show.startup.visible" class="content-body"
          :settings="services.settings"></options-startup>
        <manage-databases id="/manage/databases" 
          v-if="show.manageDatabases.visible"
          :dropbox-file-manager="services.dropboxFileManager"
          :google-drive-manager="services.googleDrivePasswordFileManager"
          :onedrive-manager="services.oneDriveFileManager"
          :sample-manager="services.sampleDatabaseFileManager"></manage-databases>
        <manage-keyfiles id="/manage/keyfiles" 
          v-if="show.manageKeyfiles.visible"
          :settings="services.settings"
          :key-file-parser="services.keyFileParser"></manage-keyfiles>
        <advanced-settings id="/advanced" 
          v-if="show.advanced.visible"
          :settings="services.settings"></advanced-settings>
      </div>
    </div>
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
import SvgDefs from '@/components/SvgDefs'

const settings = new Settings()
const protectedMemory = new ProtectedMemory()
const secureCacheMemory = new SecureCacheMemory(protectedMemory)
const secureCacheDisk = new SecureCacheDisk(protectedMemory, secureCacheMemory, settings)
const keyFileParser = new KeyFileParser()

// File Managers
const localChromePasswordFileManager = new LocalChromePasswordFileManager()
const dropboxFileManager = new DropboxFileManager(settings)
const googleDrivePasswordFileManager = new GoogleDrivePasswordFileManager()
const sharedUrlFileManager = new SharedUrlFileManager()
const oneDriveFileManager = new OneDriveFileManager(settings)
const sampleDatabaseFileManager = new SampleDatabaseFileManager()

const passwordFileStoreRegistry = new PasswordFileStore(localChromePasswordFileManager, dropboxFileManager, googleDrivePasswordFileManager, sharedUrlFileManager, sampleDatabaseFileManager, oneDriveFileManager)

export default {
  name: 'app',
  components: {
    OptionsNavbar,
    OptionsStartup,
    ManageDatabases,
    ManageKeyfiles,
    AdvancedSettings,
    SvgDefs
  },
  data () {
    return {
      routes: [],
      initialTab: "/", // The tab to start on.
      services: {
        settings,
        dropboxFileManager,
        googleDrivePasswordFileManager,
        oneDriveFileManager,
        sampleDatabaseFileManager,
        keyFileParser
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
    this.$router.route(this.initialTab)
  }
}
</script>

<style lang="scss">
@import './styles/options.scss';

body {
  background-color: $background-color;
}

#overflowbox {
  overflow-y: auto;
  margin-top: 60px;
}
#contentbox {
  margin: 0px auto;
  width: $options-width;
  /* height: 490px; */
}
</style>
