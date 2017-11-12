"use strict";

// Vue Components
import Vue from 'vue'
import Popup from './Popup.vue'
import VirtualRouter from '$lib/virtual-router.js'

/*
<link rel="stylesheet" href="/lib/animate.css" />
  <link rel="stylesheet" href="/lib/pure.min.css" />
  <link rel="stylesheet" href="/lib/angular-csp.css" />
  <link rel="stylesheet" href="popup.css" />
  <script type="text/javascript" src="/lib/salsa20.js"></script>
  <script type="text/javascript" src="/lib/argon2-asm.min.js"></script>
  <script type="text/javascript" src="/lib/argon2.js"></script>
  <script type="text/javascript" src="/lib/base64.js"></script>
  <script type="text/javascript" src="/lib/case.min.js"></script>
  <script type="text/javascript" src="/lib/kdbxweb.js"></script>
  <script type="text/javascript" src="/services/settings.js"></script>
  <script type="text/javascript" src="/services/optionsLink.js"></script>
  <script type="text/javascript" src="/services/unlockedState.js"></script>
  <script type="text/javascript" src="/services/protectedMemory.js"></script>
  <script type="text/javascript" src="/services/passwordFileStore.js"></script>
  <script type="text/javascript" src="/services/googleDrivePasswordFileManager.js"></script>
  <script type="text/javascript" src="/services/sharedUrlFileManager.js"></script>
  <script type="text/javascript" src="/services/localChromePasswordFileManager.js"></script>
  <script type="text/javascript" src="/services/sampleDatabaseFileManager.js"></script>
 	<script type="text/javascript" src="/services/dropboxFileManager.js"></script>
  <script type="text/javascript" src="/services/oneDriveFileManager.js"></script>
  <script type="text/javascript" src="/services/keepassHeader.js"></script>
  <script type="text/javascript" src="/services/keepassService.js"></script>
  <script type="text/javascript" src="/services/secureCacheMemory.js"></script>
  <script type="text/javascript" src="/services/secureCacheDisk.js"></script>
  <script type="text/javascript" src="/services/keepassReference.js"></script>
  <script type="text/javascript" src="controllers/settingsLink.js"></script>
  <script type="text/javascript" src="controllers/chooseFileController.js"></script>
  <script type="text/javascript" src="controllers/masterPasswordController.js"></script>
  <script type="text/javascript" src="controllers/startupController.js"></script>
  <script type="text/javascript" src="controllers/findEntryController.js"></script>
  <script type="text/javascript" src="controllers/entryDetailsController.js"></script>
  <script type="text/javascript" src="controllers/passwordListController.js"></script>
  <script type="text/javascript" src="popup.js"></script>
*/

// Libraries
import pako from '$lib/pako.min.js'
import chromeApiPromise from '$lib/chrome-api-promise.js'
import salsa20 from '$lib/salsa20.js'
import argon2 from '$lib/argon2.js' //requires argon2 web assembly
import base64 from '$lib/base64.js'

// File managers
import sampleDatabaseFileManager from '$services/sampleDatabaseFileManager'

// Set up routes
Vue.prototype.$router = new VirtualRouter([
  '/unlock/:database',
  '/foo'
])

new Vue({
  el: '#app',
  render: h => h(Popup)
})

// keepassApp.factory('passwordFileStoreRegistry', ['localChromePasswordFileManager', 
//   'dropboxFileManager', 
//   'googleDrivePasswordFileManager',
//   'sharedUrlFileManager',  
//   'oneDriveFileManager',
//   'sampleDatabaseFileManager', 
//   function(localChromePasswordFileManager, 
//     dropboxFileManager,
//     googleDrivePasswordFileManager,
//     sharedUrlFileManager,
//     oneDriveFileManager,
//     sampleDatabaseFileManager) {
//   return new PasswordFileStoreRegistry(localChromePasswordFileManager, dropboxFileManager, googleDrivePasswordFileManager, sharedUrlFileManager, oneDriveFileManager, sampleDatabaseFileManager);
// }]);

// keepassApp.factory('sampleDatabaseFileManager', ['$http', function($http) {
// 	return new SampleDatabaseFileManager($http);
// }]);

// keepassApp.factory('dropboxFileManager', ['$http', 'settings', function($http, settings) {
// 	return new DropboxFileManager($http, settings);
// }]);

// keepassApp.factory('googleDrivePasswordFileManager', ['$http', '$timeout', function($http, $timeout) {
// 	return new GoogleDrivePasswordFileManager($http, $timeout);
// }]);

// keepassApp.factory('sharedUrlFileManager', ['$http', '$timeout', function($http, $timeout) {
//   return new SharedUrlFileManager($http, $timeout);
// }]);

// keepassApp.factory('oneDriveFileManager', ['$http', '$q', 'settings', function($http, $q, settings) {
//   return new OneDriveFileManager($http, $q, settings);
// }]);

// keepassApp.factory('localChromePasswordFileManager', [function() {
// 	return new LocalChromePasswordFileManager();
// }]);

// keepassApp.factory('optionsLink', [function() {
//   return new OptionsLink();
// }]);

// keepassApp.factory('settings', [function() {
//   return new Settings();
// }]);

// keepassApp.factory('protectedMemory', [function() {
//   return new ProtectedMemory();
// }]);

// keepassApp.factory('keepassHeader', ['settings', function(settings) {
//   return new KeepassHeader(pako, settings);
// }]);

// keepassApp.factory('keepassReference', [function() {
//   return new KeepassReference();
// }]);

// keepassApp.factory('keepass', ['keepassHeader', 'pako', 'settings', 'passwordFileStoreRegistry', 'keepassReference', function(keepassHeader, pako, settings, passwordFileStoreRegistry, keepassReference) {
// 	return new Keepass(keepassHeader, pako, settings, passwordFileStoreRegistry, keepassReference);
// }]);

// keepassApp.factory('unlockedState', ['$interval', '$location', 'keepassReference', 'protectedMemory', 'settings', function($interval, $location, keepassReference, protectedMemory, settings) {
//   return new UnlockedState($interval, $location, keepassReference, protectedMemory, settings);
// }]);

// keepassApp.factory('secureCacheMemory', ['protectedMemory', function(protectedMemory) {
//   return new SecureCacheMemory(protectedMemory);
// }])

// keepassApp.factory('secureCacheDisk', ['protectedMemory', 'secureCacheMemory', 'settings', function(protectedMemory, secureCacheMemory, settings) {
//   return new SecureCacheDisk(protectedMemory, secureCacheMemory, settings);
// }])