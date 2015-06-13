function FileTypeController($scope, $location, passwordFileStoreRegistry) {
	"use strict";

  $scope.fileManagers = passwordFileStoreRegistry.listFileManagers();

  $scope.choose = function(fm) {
    $location.path(fm.routePath);
  }

  $scope.setDescription = function(fm) {
    $scope.description=fm.chooseDescription;
  }

  $scope.clearDescription = function() {
    $scope.description='';
  }

  /*
  $scope.os = {};
  chrome.runtime.getPlatformInfo(function(info) {
    $scope.$apply(function() {
      $scope.os[info.os] = true;
    })
  });
  */
}
