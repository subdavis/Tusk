<template>
  <div id="main">
    <!-- Router View -->
    <startup id="/" v-if="show.startup.val"
      :settings="services.settings"
      :password-file-store-registry="services.passwordFileStoreRegistry"></startup>
    <file-picker id="/choose" v-if="show.filePicker.val" 
      :password-file-store-registry="services.passwordFileStoreRegistry"></file-picker>
    <unlock id="/unlock/:provider/:title" v-if="show.unlock.val"
      :unlocked-state="services.unlockedState" 
      :secure-cache="services.secureCache" 
      :settings="services.settings"
      :keepass-service="services.keepassService"></unlock>
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
// File Managers
import LocalChromePasswordFileManager from '$services/localChromePasswordFileManager.js'
import { GoogleDrivePasswordFileManager } from '$services/googleDrivePasswordFileManager.js'
import { DropboxFileManager } from '$services/dropboxFileManager.js'
import { OneDriveFileManager } from '$services/oneDriveFileManager.js'
import { SharedUrlFileManager } from '$services/sharedUrlFileManager.js'
import { SampleDatabaseFileManager } from '$services/sampleDatabaseFileManager.js'
// Components
import Unlock from '@/components/Unlock'
import Startup from '@/components/Startup'
import FilePicker from '@/components/FilePicker'

const chromePromiseApi = ChromePromiseApi()
const settings = new Settings()
const protectedMemory = new ProtectedMemory()
const secureCacheMemory = new SecureCacheMemory(protectedMemory)
const secureCacheDisk = new SecureCacheDisk(protectedMemory, secureCacheMemory, settings)
const keepassHeader = new KeepassHeader(settings)
const keepassReference = new KeepassReference()
const $q = function(){} // TODO: wtf is this for.

// File Managers
const localChromePasswordFileManager = new LocalChromePasswordFileManager(chromePromiseApi)
const dropboxFileManager = new DropboxFileManager(settings, chromePromiseApi)
const googleDrivePasswordFileManager = new GoogleDrivePasswordFileManager(chromePromiseApi)
const sharedUrlFileManager = new SharedUrlFileManager(chromePromiseApi)
const oneDriveFileManager = new OneDriveFileManager($q, settings, chromePromiseApi)
const sampleDatabaseFileManager = new SampleDatabaseFileManager(chromePromiseApi)

const passwordFileStoreRegistry = new PasswordFileStore(localChromePasswordFileManager, dropboxFileManager, googleDrivePasswordFileManager, sharedUrlFileManager, sampleDatabaseFileManager)
const keepassService = new KeepassService(keepassHeader, settings, passwordFileStoreRegistry, keepassReference)

export default {
  name: 'app',
  components: {
    Unlock,
    Startup,
    FilePicker
  },
  data () {
    return {
      services: {
        /* The services exposed to UI components */
        settings,
        secureCache: secureCacheDisk,
        passwordFileStoreRegistry,
        keepassService,
        unlockedState: new UnlockedState(this.$router, chromePromiseApi, keepassReference, protectedMemory, settings)
      },
      show: {
        unlock: { val: false },
        startup: { val: false },
        filePicker: { val: false }
      }
    }
  },
  mounted: function () {
    // Relies on the content of this.show
    this.$router.registerRoutes([
      { route: '/', var: this.show.startup },
      { route: '/choose', var: this.show.filePicker },
      { route: '/unlock/:provider/:title', var:this.show.unlock }
    ])
    this.$router.route('/')
  }
}
</script>

<style lang="scss">
@import "./styles/settings.scss";
#main {
  width: 400px;
  margin: 0px auto;
  color: #2c3e50;
}

body {
  margin: 0px;
  width: 100%;
}
</style>
