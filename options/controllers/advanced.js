"use strict";

function AdvancedController($scope, settings, secureCacheDisk) {
  settings.getDiskCacheFlag().then(function(flag) {
    $scope.useDiskCache = flag;
    $scope.$apply();
  });

  $scope.updateDiskCacheFlag = function() {
    settings.setDiskCacheFlag($scope.useDiskCache);
    if (!$scope.useDiskCache) {
      secureCacheDisk.clear('entries');
      secureCacheDisk.clear('streamKey');
    }
  }
}
