"use strict";

function AdvancedController($scope, settings, secureCacheDisk) {
	$scope.flags = {
		useDiskCache: false,
		useCredentialApi: false
	};

  settings.getDiskCacheFlag().then(function(flag) {
    $scope.flags.useDiskCache = flag;
    $scope.$apply();
  });

  settings.getUseCredentialApiFlag().then( flag => {
  	$scope.flags.useCredentialApi = flag;
  	$scope.$apply();
  })

  $scope.updateDiskCacheFlag = function() {
    settings.setDiskCacheFlag($scope.flags.useDiskCache);
    if (!$scope.useDiskCache) {
      secureCacheDisk.clear('entries');
    }
  }

  $scope.updateUseCredentialApiFlag = function() {
  	settings.setUseCredentialApiFlag($scope.flags.useCredentialApi)
  }

  $scope.flagEnabled = !!(navigator.credentials)
}
