
var keepassApp = angular.module('keepassApp', []);

keepassApp.factory('gdocs', function() {
	var gdocs = new GDocs();

	return gdocs;
});

keepassApp.factory('keepass', ['gdocs', function(gdocs) {
	var kp = new Keepass(gdocs);

	return kp;
}]);
