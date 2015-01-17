
var keepassApp = angular.module('keepassApp', ['ngAnimate', 'ngRoute', 'myControllers']);

keepassApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/choose-file', {
    templateUrl: chrome.extension.getURL('/popups/partials/choose-file.html'),
    controller: 'docsController'
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
	var gdocs = new GDocs();

	return gdocs;
});

keepassApp.factory('pako', function() {
  return pako;
});

keepassApp.factory('keepass', ['gdocs', 'pako', function(gdocs) {
	var kp = new Keepass(gdocs, pako);

	return kp;
}]);

var myControllers = angular.module('myControllers', []);

myControllers.controller('startupController', ['$scope', '$http', '$location', 'gdocs', 'keepass', StartupController]);
myControllers.controller('docsController', ['$scope', '$http', '$location', 'gdocs', 'keepass', DocsController]);
myControllers.controller('masterPasswordController', ['$scope', '$interval', '$http', '$routeParams', '$location', 'gdocs', 'keepass', MasterPasswordController]);
