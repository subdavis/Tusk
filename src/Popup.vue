<template>
  <div id="app">
    <!-- Router View -->
    <unlock id="/unlock/:provider/:title" 
      :unlocked-state="services.unlockedState" 
      :secure-cache="services.secureCache" 
      :settings="services.settings"></unlock>
    <startup id="/" 
      :settings="services.settings"
      :password-file-store-registry="services.passwordFileStoreRegistry"></startup>
  </div>
</template>

<script>
// Singletons
import ChromePromiseApi from '$lib/chrome-api-promise.js'
import Settings from '$services/settings.js'
import ProtectedMemory from '$services/protectedMemory.js'
import { KeepassHeader } from '$services/keepassHeader.js'
import KeepassReference from '$services/keepassReference.js'
import { KeepassService } from '$services/keepassService.js'
import UnlockedState from '$services/unlockedState.js'
import SecureCacheMemory from '$services/secureCacheMemory.js'
import SecureCacheDisk from '$services/secureCacheDisk.js'
import PasswordFileStore from '$services/passwordFileStore.js'
// File Managers
import LocalChromePasswordFileManager from '$services/localChromePasswordFileManager.js'
import GoogleDrivePasswordFileManager from '$services/googleDrivePasswordFileManager.js'
import DropboxFileManager from '$services/dropboxFileManager.js'
import OneDriveFileManager from '$services/oneDriveFileManager.js'
import SharedUrlFileManager from '$services/sharedUrlFileManager.js'
import SampleDatabaseFileManager from '$services/sampleDatabaseFileManager.js'
// Components
import Unlock from '@/components/Unlock'
import Startup from '@/components/Startup'

const chromePromiseApi = ChromePromiseApi()
const settings = new Settings(chromePromiseApi)
const protectedMemory = new ProtectedMemory()
const secureCacheMemory = new SecureCacheMemory(protectedMemory)
const secureCacheDisk = new SecureCacheDisk(protectedMemory, secureCacheMemory, settings)
const keepassHeader = new KeepassHeader(settings)
const keepassReference = new KeepassReference()
const $http = function(){}
const $q = function(){}

// File Managers
const localChromePasswordFileManager = new LocalChromePasswordFileManager(chromePromiseApi)
const dropboxFileManager = new DropboxFileManager($http, settings, chromePromiseApi)
const googleDrivePasswordFileManager = new GoogleDrivePasswordFileManager($http, chromePromiseApi)
const sharedUrlFileManager = new SharedUrlFileManager($http, chromePromiseApi)
const oneDriveFileManager = new OneDriveFileManager($http, $q, settings, chromePromiseApi)
const sampleDatabaseFileManager = new SampleDatabaseFileManager($http, chromePromiseApi)

const passwordFileStoreRegistry = new PasswordFileStore(localChromePasswordFileManager, dropboxFileManager, googleDrivePasswordFileManager, sharedUrlFileManager, oneDriveFileManager, sampleDatabaseFileManager)
const keepassService = new KeepassService(keepassHeader, settings, passwordFileStoreRegistry, keepassReference)

export default {
  name: 'app',
  components: {
    Unlock,
    Startup
  },
  data () {
    return {
      services: { // The services exposed to UI components.
        settings: settings,
        secureCache: secureCacheDisk,
        passwordFileStoreRegistry: passwordFileStoreRegistry,
        keepassService: keepassService,
        unlockedState: new UnlockedState(this.$router, keepassReference, protectedMemory, settings)
      }
    }
  },
  mounted: function () {
    this.$router.route('/')
  }
}
</script>

<style lang="scss">
#app {
  width: 450px;
  margin: 0px auto;
  color: #2c3e50;
}

body {
  margin: 0px;
  width: 100%;
}
</style>
