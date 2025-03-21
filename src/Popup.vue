<template>
	<div id="router-view">
		<!-- SVG Defs -->
		<svg-defs></svg-defs>
		<!-- Router View -->
		<startup id="/" v-if="show.startup.visible" :settings="settings"
			:password-file-store-registry="passwordFileStoreRegistry"></startup>
		<file-picker id="/choose" v-if="show.filePicker.visible" :password-file-store-registry="passwordFileStoreRegistry"
			:settings="settings" :links="links"></file-picker>
		<unlock id="/unlock/:provider/:title" v-if="show.unlock.visible" :unlocked-state="unlockedState"
			:secure-cache="secureCache" :links="links" :settings="settings" :keepass-service="keepassService"></unlock>
		<entry-details id="/entry-details/:entryId" v-if="show.entryDetails.visible" :unlocked-state="unlockedState"
			:links="links" :settings="settings"></entry-details>
		<!-- End Router View -->
	</div>
</template>

<script setup>
/* beautify preserve:start */
// Singletons
import { Settings } from '$services/settings.js'
import { ProtectedMemory } from '$services/protectedMemory'
import { KeepassHeader } from '$services/keepassHeader.js'
import { KeepassReference } from '$services/keepassReference.js'
import { KeepassService } from '$services/keepassService.js'
import { UnlockedState } from '$services/unlockedState.js'
import { SecureCacheMemory } from '$services/secureCacheMemory.js'
import { PasswordFileStoreRegistry } from '$services/passwordFileStore.js'
import { Links } from '$services/links.js'
import { Notifications } from '$services/notifications.js'
// File Managers
import { LocalChromePasswordFileManager } from '$services/localChromePasswordFileManager.js'
import { GoogleDrivePasswordFileManager } from '$services/googleDrivePasswordFileManager.js'
import { DropboxFileManager } from '$services/dropboxFileManager.js'
import { OneDriveFileManager } from '$services/oneDriveFileManager.js'
import { PCloudFileManager } from '$services/pCloudFileManager.js'
import { SharedUrlFileManager } from '$services/sharedUrlFileManager.js'
import { SampleDatabaseFileManager } from '$services/sampleDatabaseFileManager.js'
import { WebdavFileManager } from '$services/webdavFileManager.js'
// Components
import Unlock from '@/components/Unlock.vue'
import Startup from '@/components/Startup.vue'
import FilePicker from '@/components/FilePicker.vue'
import EntryDetails from '@/components/EntryDetails.vue'
import SvgDefs from '@/components/SvgDefs.vue'
import { reactive } from 'vue'
import { useRouter } from '@/lib/useRouter.js'

const links = new Links()
const protectedMemory = new ProtectedMemory()
const secureCache = new SecureCacheMemory(protectedMemory)
const settings = new Settings(secureCache)
const keepassHeader = new KeepassHeader(settings)
const keepassReference = new KeepassReference()
const notifications = new Notifications(settings)

// File Managers
const localChromePasswordFileManager = new LocalChromePasswordFileManager()
const dropboxFileManager = new DropboxFileManager(settings)
const googleDrivePasswordFileManager = new GoogleDrivePasswordFileManager(settings)
const sharedUrlFileManager = new SharedUrlFileManager()
const oneDriveFileManager = new OneDriveFileManager(settings)
const pCloudFileManager = new PCloudFileManager(settings)
const sampleDatabaseFileManager = new SampleDatabaseFileManager()
const webdavFileManager = new WebdavFileManager(settings)

const passwordFileStoreRegistry = new PasswordFileStoreRegistry(
	localChromePasswordFileManager,
	dropboxFileManager,
	googleDrivePasswordFileManager,
	sharedUrlFileManager,
	sampleDatabaseFileManager,
	oneDriveFileManager,
	pCloudFileManager,
	webdavFileManager)
const keepassService = new KeepassService(keepassHeader, settings, passwordFileStoreRegistry, keepassReference)
const unlockedState = new UnlockedState(keepassReference, settings, notifications)
/* beautify preserve:end */

const show = reactive({
	unlock: {
		visible: false
	},
	startup: {
		visible: false
	},
	filePicker: {
		visible: false
	},
	entryDetails: {
		visble: false
	}
})

const $router = useRouter();
$router.registerRoutes([{
	route: '/',
	var: show.startup
},
{
	route: '/choose',
	var: show.filePicker
},
{
	route: '/unlock/:provider/:title',
	var: show.unlock
},
{
	route: '/entry-details/:entryId',
	var: show.entryDetails
}
])
$router.route('/')


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
