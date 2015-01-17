
var keepassApp = angular.module('keepassApp', ['ngAnimate', 'ngRoute']);

keepassApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/choose-file', {
    templateUrl: chrome.extension.getURL('/popups/partials/choose-file.html'),
    controller: 'docsController'
  }).when('/choose-file-type', {
    templateUrl: chrome.extension.getURL('/popups/partials/choose-file-type.html'),
    controller: 'fileTypeController'
  }).when('/drag-drop-file', {
    templateUrl: chrome.extension.getURL('/popups/partials/drag-drop-file.html'),
    controller: 'dragDropController'
  }).when('/enter-password/:fileTitle', {
    templateUrl: chrome.extension.getURL('/popups/partials/enter-password.html'),
    controller: 'masterPasswordController'
  }).when('/startup', {
    templateUrl: chrome.extension.getURL('/popups/partials/startup.html'),
    controller: 'startupController'
  }).otherwise({
    redirectTo: '/startup'
  });
}]);

keepassApp.factory('gdocs', function() {
	return new GDocs();
});

keepassApp.factory('pako', function() {
  return pako;
});

keepassApp.factory('passFileProvider', ['gdocs', function(gdocs) {
	return new GoogleDrivePasswordFileProvider(gdocs);
}]);

keepassApp.factory('keepass', ['passFileProvider', 'pako', function(passFileProvider, pako) {
	return new Keepass(passFileProvider, pako);
}]);

keepassApp.controller('dragDropController', ['$scope', '$http', '$location', DragDropController]);
keepassApp.controller('fileTypeController', ['$scope', '$http', '$location', FileTypeController]);
keepassApp.controller('startupController', ['$scope', '$http', '$location', 'gdocs', 'keepass', StartupController]);
keepassApp.controller('docsController', ['$scope', '$http', '$location', 'gdocs', 'keepass', DocsController]);
keepassApp.controller('masterPasswordController', ['$scope', '$interval', '$http', '$routeParams', '$location', 'keepass', MasterPasswordController]);

//http://blog.parkji.co.uk/2013/08/11/native-drag-and-drop-in-angularjs.html
keepassApp.directive('draggable', function() {
  return function(scope, element) {
    // this gives us the native JS object
    var el = element[0];

    el.draggable = true;

    el.addEventListener(
      'dragstart',
      function(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('Text', this.id);
        this.classList.add('drag');
        return false;
      },
      false
    );

    el.addEventListener(
      'dragend',
      function(e) {
        this.classList.remove('drag');
        return false;
      },
      false
    );
  }
});

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
