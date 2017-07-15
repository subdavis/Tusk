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

var keepassApp = angular.module('keepassApp', ['ngAnimate', 'ngRoute', 'ngSanitize']);

keepassApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/choose-file', {
    templateUrl: chrome.extension.getURL('/popups/partials/choose-file.html'),
    controller: 'chooseFileController'
  }).when('/enter-password/:providerKey/:fileTitle', {
    templateUrl: chrome.extension.getURL('/popups/partials/enter-password.html'),
    controller: 'masterPasswordController'
  }).when('/find-entry', {
    templateUrl: chrome.extension.getURL('/popups/partials/find-entry.html'),
    controller: 'findEntryController'
  }).when('/startup', {
    templateUrl: chrome.extension.getURL('/popups/partials/startup.html'),
    controller: 'startupController'
  }).when('/entry-details/:entryId', {
    templateUrl: chrome.extension.getURL('/popups/partials/entry-details.html'),
    controller: 'entryDetailsController'
  }).otherwise({
    redirectTo: '/startup'
  });
}]);

keepassApp.factory('pako', function() {
  return pako;
});

keepassApp.factory('passwordFileStoreRegistry', ['localChromePasswordFileManager', 
  'dropboxFileManager', 
  'googleDrivePasswordFileManager',
  'sharedUrlFileManager',  
  'oneDriveFileManager',
  'sampleDatabaseFileManager', 
  function(localChromePasswordFileManager, 
    dropboxFileManager,
    googleDrivePasswordFileManager,
    sharedUrlFileManager,
    oneDriveFileManager,
    sampleDatabaseFileManager) {
  return new PasswordFileStoreRegistry(localChromePasswordFileManager, dropboxFileManager, googleDrivePasswordFileManager, sharedUrlFileManager, oneDriveFileManager, sampleDatabaseFileManager);
}]);

keepassApp.factory('sampleDatabaseFileManager', ['$http', function($http) {
	return new SampleDatabaseFileManager($http);
}]);

keepassApp.factory('dropboxFileManager', ['$http', 'settings', function($http, settings) {
	return new DropboxFileManager($http, settings);
}]);

keepassApp.factory('googleDrivePasswordFileManager', ['$http', '$timeout', function($http, $timeout) {
	return new GoogleDrivePasswordFileManager($http, $timeout);
}]);

keepassApp.factory('sharedUrlFileManager', ['$http', '$timeout', function($http, $timeout) {
  return new SharedUrlFileManager($http, $timeout);
}]);

keepassApp.factory('oneDriveFileManager', ['$http', '$q', 'settings', function($http, $q, settings) {
  return new OneDriveFileManager($http, $q, settings);
}]);

keepassApp.factory('localChromePasswordFileManager', [function() {
	return new LocalChromePasswordFileManager();
}]);

keepassApp.factory('optionsLink', [function() {
  return new OptionsLink();
}]);

keepassApp.factory('settings', [function() {
  return new Settings();
}]);

keepassApp.factory('protectedMemory', [function() {
  return new ProtectedMemory();
}]);

keepassApp.factory('keepassHeader', ['settings', function(settings) {
  return new KeepassHeader(pako, settings);
}]);

keepassApp.factory('streamCipher', [function() {
  return new StreamCipher();
}]);

keepassApp.factory('keepassReference', ['streamCipher', function(streamCipher) {
  return new KeepassReference(streamCipher);
}]);

keepassApp.factory('keepass', ['keepassHeader', 'pako', 'settings', 'passwordFileStoreRegistry', 'keepassReference', 'streamCipher', function(keepassHeader, pako, settings, passwordFileStoreRegistry, keepassReference, streamCipher) {
	return new Keepass(keepassHeader, pako, settings, passwordFileStoreRegistry, keepassReference, streamCipher);
}]);

keepassApp.factory('unlockedState', ['$interval', '$location', 'keepassReference', 'protectedMemory', 'settings', function($interval, $location, keepassReference, protectedMemory, settings) {
  return new UnlockedState($interval, $location, keepassReference, protectedMemory, settings);
}]);

keepassApp.factory('secureCacheMemory', ['protectedMemory', function(protectedMemory) {
  return new SecureCacheMemory(protectedMemory);
}])

keepassApp.factory('secureCacheDisk', ['protectedMemory', 'secureCacheMemory', 'settings', function(protectedMemory, secureCacheMemory, settings) {
  return new SecureCacheDisk(protectedMemory, secureCacheMemory, settings);
}])

keepassApp.controller('startupController', ['$scope', '$location', 'settings', 'optionsLink', 'passwordFileStoreRegistry', StartupController]);
keepassApp.controller('chooseFileController', ['$scope', '$location', 'passwordFileStoreRegistry', 'settings', ChooseFileController]);
keepassApp.controller('masterPasswordController', ['$scope', '$routeParams', '$location', 'keepass', 'unlockedState', 'secureCacheDisk', 'settings', 'optionsLink', 'streamCipher', MasterPasswordController]);
keepassApp.controller('findEntryController', ['$scope', 'unlockedState', 'secureCacheDisk', 'streamCipher', FindEntryController]);
keepassApp.controller('entryDetailsController', ['$scope', '$routeParams', '$location', 'unlockedState', EntryDetailsController]);
keepassApp.controller('settingsLinkController', ['$scope', '$location', 'optionsLink', SettingsLinkController]);
keepassApp.controller('passwordListController', ['$scope', 'settings', PasswordListController]);

keepassApp.directive('icon', function() {
  function link(scope, element, attrs) {
    function renderSVG() {
      var icon = element.scope()[attrs.p];  //evaluate as scope expression
      if (!icon)
        icon = attrs.p;
      var html = '<svg class="icon ' + icon + '"><use xlink:href="#' + icon + '"></use></svg>';
      element.replaceWith( html );
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
keepassApp.directive('fileChange', function() {
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

//based on http://blog.parkji.co.uk/2013/08/11/native-drag-and-drop-in-angularjs.html
keepassApp.directive('droppable', function() {
  return {
    scope: {
      drop: '&',
      bin: '='
    },
    link: function(scope, element) {
      // again we need the native object
      var el = element[0];

      el.addEventListener(
        'dragover',
        function(e) {
          e.dataTransfer.dropEffect = 'copy';
          // allows us to drop
          if (e.preventDefault) e.preventDefault();
          this.classList.add('over');
          return false;
        },
        false
      );

      el.addEventListener(
        'dragenter',
        function(e) {
          this.classList.add('over');
          return false;
        },
        false
      );

      el.addEventListener(
        'dragleave',
        function(e) {
          this.classList.remove('over');
          return false;
        },
        false
      );

      el.addEventListener(
        'drop',
        function(e) {
          // Stops some browsers from redirecting.
          e.stopPropagation();
          e.preventDefault();

          this.classList.remove('over');

          var files = e.dataTransfer.files;
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

          // call the passed drop function
          scope.$apply(function(scope) {
            var fn = scope.drop();
            if ('undefined' !== typeof fn) {
              fn(loadedFiles);
            }
          });

          return false;
        },
        false
      );
    }
  }
});

//autofocus, from an answer at http://stackoverflow.com/questions/14833326/how-to-set-focus-on-input-field
keepassApp.directive('autoFocus', function($timeout) {
    return {
        restrict: 'AC',
        link: function(_scope, _element) {
            $timeout(function(){
                _element[0].focus();
            });
        }
    };
});

//http://stackoverflow.com/questions/12393703/how-to-include-one-partials-into-other-without-creating-a-new-scope
keepassApp.directive('staticInclude', function($http, $templateCache, $compile) {
	return function(scope, element, attrs) {
		var templatePath = attrs.staticInclude;
		$http.get(templatePath, { cache: $templateCache }).success(function(response) {
			var contents = element.html(response).contents();
			$compile(contents)(scope);
		});
	};
});
