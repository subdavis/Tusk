<template>
  <div id="router-view">
    <!-- SVG Defs -->
    <svg-defs></svg-defs>
    <!-- Router View -->
    <startup id="/" v-if="show.startup.visible"
      :settings="services.settings"
      :password-file-store-registry="services.passwordFileStoreRegistry"></startup>
    <file-picker id="/choose" v-if="show.filePicker.visible" 
      :password-file-store-registry="services.passwordFileStoreRegistry"
      :settings="services.settings"></file-picker>
    <unlock id="/unlock/:provider/:title" v-if="show.unlock.visible"
      :unlocked-state="services.unlockedState" 
      :secure-cache="services.secureCache" 
      :links="services.links"
      :settings="services.settings"
      :keepass-service="services.keepassService"></unlock>
    <entry-details id="/entry-details/:entryId" v-if="show.entryDetails.visible"
      :unlocked-state="services.unlockedState"
      :settings="services.settings"></entry-details>
    <!-- End Router View -->
  </div>
</template>

<script>
// Singletons
import { Settings } from '$services/settings.js'
import ProtectedMemory from '$services/protectedMemory.js'
import { KeepassHeader } from '$services/keepassHeader.js'
import { KeepassReference } from '$services/keepassReference.js'
import { KeepassService } from '$services/keepassService.js'
import { UnlockedState } from '$services/unlockedState.js'
import SecureCacheMemory from '$services/secureCacheMemory.js'
import SecureCacheDisk from '$services/secureCacheDisk.js'
import PasswordFileStore from '$services/passwordFileStore.js'
import { Links } from '$services/links.js'
// File Managers
import { LocalChromePasswordFileManager } from '$services/localChromePasswordFileManager.js'
import { GoogleDrivePasswordFileManager } from '$services/googleDrivePasswordFileManager.js'
import { DropboxFileManager } from '$services/dropboxFileManager.js'
import { OneDriveFileManager } from '$services/oneDriveFileManager.js'
import { SharedUrlFileManager } from '$services/sharedUrlFileManager.js'
import { SampleDatabaseFileManager } from '$services/sampleDatabaseFileManager.js'
// Components
import Unlock from '@/components/Unlock'
import Startup from '@/components/Startup'
import FilePicker from '@/components/FilePicker'
import EntryDetails from '@/components/EntryDetails'
import SvgDefs from '@/components/SvgDefs'

const settings = new Settings()
const links = new Links()
const protectedMemory = new ProtectedMemory()
const secureCacheMemory = new SecureCacheMemory(protectedMemory)
const secureCacheDisk = new SecureCacheDisk(protectedMemory, secureCacheMemory, settings)
const keepassHeader = new KeepassHeader(settings)
const keepassReference = new KeepassReference()

// File Managers
const localChromePasswordFileManager = new LocalChromePasswordFileManager()
const dropboxFileManager = new DropboxFileManager(settings)
const googleDrivePasswordFileManager = new GoogleDrivePasswordFileManager()
const sharedUrlFileManager = new SharedUrlFileManager()
const oneDriveFileManager = new OneDriveFileManager(settings)
const sampleDatabaseFileManager = new SampleDatabaseFileManager()

const passwordFileStoreRegistry = new PasswordFileStore(localChromePasswordFileManager, dropboxFileManager, googleDrivePasswordFileManager, sharedUrlFileManager, sampleDatabaseFileManager, oneDriveFileManager)
const keepassService = new KeepassService(keepassHeader, settings, passwordFileStoreRegistry, keepassReference)

export default {
  name: 'app',
  components: {
    Unlock,
    Startup,
    FilePicker,
    EntryDetails,
    SvgDefs
  },
  data () {
    return {
      services: {
        /* The services exposed to UI components */
        settings,
        secureCache: secureCacheDisk,
        passwordFileStoreRegistry,
        keepassService,
        links,
        unlockedState: new UnlockedState(this.$router, keepassReference, protectedMemory, settings)
      },
      show: {
        unlock: { visible: false },
        startup: { visible: false },
        filePicker: { visible: false },
        entryDetails: { visble: false }
      }
    }
  },
  mounted: function () {
    // Relies on the content of this.show
    this.$router.registerRoutes([
      { route: '/', var: this.show.startup },
      { route: '/choose', var: this.show.filePicker },
      { route: '/unlock/:provider/:title', var: this.show.unlock },
      { route: '/entry-details/:entryId', var: this.show.entryDetails }
    ])
    this.$router.route('/')
  }
}
</script>

<style lang="scss">
@import "./styles/shared.scss";

#router-view {
  width: 400px;
  margin: 0px auto;
  color: $text-color;
  background-color: $background-color;
}

body {
  margin: 0px;
  width: 100%;
}
</style>
