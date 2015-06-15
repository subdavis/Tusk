function ChooseDropboxFileController($scope, dropboxFileManager) {
	"use strict";

	$scope.state = dropboxFileManager.state;

	$scope.listFiles = function() {
		$scope.busy = true;
		dropboxFileManager.listDatabases().then(function(files) {
			$scope.$apply(function() {
				$scope.files = files;
				$scope.busy = false;
			})
		}).catch(function(err) {
			$scope.$apply(function() {
				$scope.busy = false;
			});
		});
	}

	$scope.login = function() {
		dropboxFileManager.login().then(function() {
			$scope.listFiles();
		})
	}

	$scope.logout = function() {
		dropboxFileManager.logout().then(function() {
			$scope.listFiles();
		});
	}

	$scope.selectFile = function(file) {
		
	}

	$scope.listFiles();
}
