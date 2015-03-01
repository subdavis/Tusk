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

var keepassApp = angular.module('keepassApp', ['ngAnimate', 'ngRoute']);

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
  }).otherwise({
    redirectTo: '/startup'
  });
}]);

keepassApp.factory('pako', function() {
  return pako;
});

keepassApp.factory('passwordFileStoreRegistry', ['localChromePasswordFileManager', 'googleDrivePasswordFileManager', 'sampleDatabaseFileManager', function(localChromePasswordFileManager, googleDrivePasswordFileManager, sampleDatabaseFileManager) {
	return new PasswordFileStoreRegistry(localChromePasswordFileManager, googleDrivePasswordFileManager, sampleDatabaseFileManager);
}]);

keepassApp.factory('sampleDatabaseFileManager', ['$http', function($http) {
	return new SampleDatabaseFileManager($http);
}]);

keepassApp.factory('googleDrivePasswordFileManager', ['$http', function(gdocs) {
	return new GoogleDrivePasswordFileManager(gdocs);
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

keepassApp.factory('localStorage', ['settings', function(settings) {
	return new LocalStorage(settings);
}]);

keepassApp.factory('protectedMemory', [function() {
  return new ProtectedMemory();
}]);

keepassApp.factory('keepassHeader', [function() {
  return new KeepassHeader(pako, localStorage);
}]);

keepassApp.factory('keepass', ['keepassHeader', 'pako', 'settings', 'passwordFileStoreRegistry', function(keepassHeader, pako, settings, passwordFileStoreRegistry) {
	return new Keepass(keepassHeader, pako, settings, passwordFileStoreRegistry);
}]);

keepassApp.factory('unlockedState', ['$interval', 'keepass', 'protectedMemory', function($interval, keepass, protectedMemory) {
  return new UnlockedState($interval, keepass, protectedMemory);
}]);

keepassApp.factory('secureCacheMemory', ['protectedMemory', function(protectedMemory) {
  return new SecureCacheMemory(protectedMemory);
}])

keepassApp.factory('secureCacheDisk', ['protectedMemory', 'secureCacheMemory', 'settings', function(protectedMemory, secureCacheMemory, settings) {
  return new SecureCacheDisk(protectedMemory, secureCacheMemory, settings);
}])

keepassApp.controller('startupController', ['$scope', '$location', 'settings', 'optionsLink', 'passwordFileStoreRegistry', StartupController]);
keepassApp.controller('chooseFileController', ['$scope', '$location', 'passwordFileStoreRegistry', 'settings', ChooseFileController]);
keepassApp.controller('masterPasswordController', ['$scope', '$interval', '$routeParams', '$location', 'keepass', 'localStorage', 'unlockedState', 'secureCacheDisk', 'settings', 'optionsLink', MasterPasswordController]);
keepassApp.controller('findEntryController', ['$scope', 'unlockedState', 'secureCacheDisk', FindEntryController]);

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
