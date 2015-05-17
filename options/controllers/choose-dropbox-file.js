function ChooseDropboxFileController($scope, dropboxFileManager) {
	"use strict";

	$scope.state = dropboxFileManager.state;

	$scope.listFiles = function() {
		dropboxFileManager.listDatabases().then(function(files) {
			$scope.$apply(function() {
				$scope.files = files;
			})
		});
	}

	$scope.selectFile = function(file) {
		
	}
}
