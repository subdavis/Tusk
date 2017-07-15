/**

The MIT License (MIT)

Copyright (c) 2015 Steven Campbell.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

"use strict";

var keepassSettings = angular.module('keepassSettings', ['ngAnimate', 'ngRoute', 'ngSanitize', 'jsonFormatter']);

keepassSettings.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/startup', {
    templateUrl: chrome.extension.getURL('/options/partials/startup.html'),
    controller: 'startupController'
  }).when('/storedData', {
    templateUrl: chrome.extension.getURL('/options/partials/storedData.html'),
    controller: 'storedDataController'
  }).when('/keyFiles', {
    templateUrl: chrome.extension.getURL('/options/partials/manageKeyFiles.html'),
    controller: 'manageKeyFilesController'
  }).when('/databases', {
    templateUrl: chrome.extension.getURL('/options/partials/choose-file-type.html'),
    controller: 'fileTypeController'
  }).when('/choose-file', {
    templateUrl: chrome.extension.getURL('/options/partials/choose-file.html'),
    controller: 'docsController'
  }).when('/shared-url', {
    templateUrl: chrome.extension.getURL('/options/partials/shared-url.html'),
    controller: 'sharedUrlController'
  }).when('/drag-drop-file', {
    templateUrl: chrome.extension.getURL('/options/partials/drag-drop-file.html'),
    controller: 'dragDropController'
  }).when('/sample-database', {
    templateUrl: chrome.extension.getURL('/options/partials/sample-database.html'),
    controller: 'sampleDatabaseController'
  }).when('/dropbox', {
    templateUrl: chrome.extension.getURL('/options/partials/choose-dropbox-file.html'),
    controller: 'chooseDropboxFileController'
  }).when('/onedrive', {
    templateUrl: chrome.extension.getURL('/options/partials/choose-onedrive-file.html'),
    controller: 'chooseOneDriveFileController'
  }).when('/advanced', {
    templateUrl: chrome.extension.getURL('/options/partials/advanced.html'), controller: 'advancedController'
  }).when('/settings', {
    templateUrl: chrome.extension.getURL('/options/partials/settings.html'), controller: 'settingsController'
  }).otherwise({
    redirectTo: '/startup'
  });
}]);

keepassSettings.factory('passwordFileStoreRegistry', [
  'googleDrivePasswordFileManager', 
  'sharedUrlFileManager',
  'dropboxFileManager',
  'oneDriveFileManager',
  'localChromePasswordFileManager', 
  'sampleDatabaseFileManager', 
  function(googleDrivePasswordFileManager, 
    sharedUrlFileManager,
    dropboxFileManager,
    oneDriveFileManager,
    localChromePasswordFileManager, 
    sampleDatabaseFileManager) {
  return new PasswordFileStoreRegistry(googleDrivePasswordFileManager, 
    sharedUrlFileManager,
    dropboxFileManager,
    oneDriveFileManager, 
    sampleDatabaseFileManager,
    localChromePasswordFileManager);
}]);

keepassSettings.factory('googleDrivePasswordFileManager', ['$http', '$timeout', function($http, $timeout) {
	return new GoogleDrivePasswordFileManager($http, $timeout);
}]);

keepassSettings.factory('sharedUrlFileManager', ['$http', '$timeout', function($http, $timeout) {
  return new SharedUrlFileManager($http, $timeout);
}]);

keepassSettings.factory('sampleDatabaseFileManager', ['$http', function($http) {
	return new SampleDatabaseFileManager($http);
}]);

keepassSettings.factory('dropboxFileManager', ['$http', 'settings', function($http, settings) {
	return new DropboxFileManager($http, settings);
}]);

keepassSettings.factory('oneDriveFileManager', ['$http', '$q', 'settings', function($http, $q, settings) {
  return new OneDriveFileManager($http, $q, settings);
}]);

keepassSettings.factory('localChromePasswordFileManager', [function() {
	return new LocalChromePasswordFileManager();
}]);

keepassSettings.factory('settings', [function() {
  return new Settings();
}]);

keepassSettings.factory('keyFileParser', [function() {
  return new KeyFileParser();
}]);

keepassSettings.factory('protectedMemory', [function() {
  return new ProtectedMemory();
}]);

keepassSettings.factory('secureCacheMemory', ['protectedMemory', function(protectedMemory) {
  return new SecureCacheMemory(protectedMemory);
}])

keepassSettings.factory('secureCacheDisk', ['protectedMemory', 'secureCacheMemory', 'settings', function(protectedMemory, secureCacheMemory, settings) {
  return new SecureCacheDisk(protectedMemory, secureCacheMemory, settings);
}])

keepassSettings.controller('startupController', ['$scope', 'settings', StartupController]);
keepassSettings.controller('storedDataController', ['$scope', StoredDataController]);
keepassSettings.controller('manageKeyFilesController', ['$scope', 'settings', 'keyFileParser', ManageKeyFilesController]);
keepassSettings.controller('advancedController', ['$scope', 'settings', 'secureCacheDisk', AdvancedController]);
keepassSettings.controller('settingsController', ['$scope', 'settings', SettingsController]);
keepassSettings.controller('dragDropController', ['$scope', 'localChromePasswordFileManager', DragDropController]);
keepassSettings.controller('sampleDatabaseController', ['$scope', 'sampleDatabaseFileManager', SampleDatabaseController]);
keepassSettings.controller('fileTypeController', ['$scope', '$location', 'passwordFileStoreRegistry', FileTypeController]);
keepassSettings.controller('docsController', ['$scope', 'googleDrivePasswordFileManager', DocsController]);
keepassSettings.controller('sharedUrlController', ['$scope', 'sharedUrlFileManager', SharedUrlController]);
keepassSettings.controller('chooseDropboxFileController', ['$scope', 'dropboxFileManager', ChooseDropboxFileController]);
keepassSettings.controller('chooseOneDriveFileController', ['$scope', 'oneDriveFileManager', ChooseOneDriveFileController]);
keepassSettings.controller('navController', ['$scope', '$location', NavController]);


keepassSettings.directive('icon', function() {
  function link(scope, element, attrs) {
    function renderSVG() {
      var icon = element.scope()[attrs.p]; //evaluate as scope expression
      if (!icon)
        icon = attrs.p;
      var html = '<svg class="icon ' + icon + '"><use xlink:href="#' + icon + '"></use></svg>';
      element.replaceWith(html);
    }

    renderSVG();
  }

  return {
    link: link,
    restrict: 'E'
  };
});

//quick and dirty directive for file upload, based on answers from
// http://stackoverflow.com/questions/17922557/angularjs-how-to-check-for-changes-in-file-input-fields
keepassSettings.directive('fileChange', function() {
  return {
    restrict: "A",
    link: function (scope, element, attrs) {
      var onChangeFunc = element.scope()[attrs.fileChange];
      element.bind('change', function(e) {
        var files = e.target.files;
        var loadedFiles = [];
        for (var i = 0, f; f = files[i]; i++) {
          // Read the File objects in this FileList.
          var loadedFile = new Promise(function(resolve, reject) {
            var reader = new FileReader();

            reader.onloadend = (function(theFile) {
              return function(e) {
                resolve({data: e.target.result, file: theFile});
              };
            })(f);

            reader.onerror = reader.onabort = (function(theFile) {
              return function(e) {
                reject(new Error("File upload failed"));
              };
            })(f);

            reader.readAsArrayBuffer(f);
          });

          loadedFiles.push(loadedFile);
        }

        onChangeFunc(loadedFiles);
      });
    }
  };
});
