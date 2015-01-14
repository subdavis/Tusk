
var keepassApp = angular.module('keepassApp', ['ngAnimate']);

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
