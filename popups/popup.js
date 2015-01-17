
var keepassApp = angular.module('keepassApp', ['ngAnimate', 'ngRoute', 'myControllers']);

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

var myControllers = angular.module('myControllers', []);

myControllers.controller('dragDropController', ['$scope', '$http', '$location', DragDropController]);
myControllers.controller('fileTypeController', ['$scope', '$http', '$location', FileTypeController]);
myControllers.controller('startupController', ['$scope', '$http', '$location', 'gdocs', 'keepass', StartupController]);
myControllers.controller('docsController', ['$scope', '$http', '$location', 'gdocs', 'keepass', DocsController]);
myControllers.controller('masterPasswordController', ['$scope', '$interval', '$http', '$routeParams', '$location', 'keepass', MasterPasswordController]);
