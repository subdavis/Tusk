function EntryDetailsController($scope, $routeParams, $location, unlockedState) {
	"use strict";

	var entryId = decodeURIComponent($routeParams.entryId);
	$scope.entry = unlockedState.entries.filter(function(entry) {
		return entry.id == entryId;
	})[0];

	$scope.attributes = $scope.entry.keys.map(function(key) {
		return {
			'key': key,
			'value': ($scope.entry[key] || "").replace(/\n/g, "<br>")
		};
	});

	for (var protectedKey in $scope.entry.protectedData) {
		$scope.attributes.push({
			'key': protectedKey,
			'value': '', 
			'protected': true,
			'protectedAttr': $scope.entry.protectedData[protectedKey]
		});
	}

	$scope.exposeAttribute = function(attr) {
		attr.value = unlockedState.getDecryptedAttribute(attr.protectedAttr);
	}

	$scope.goBack = function() {
		$location.path('/startup');
	}
}
