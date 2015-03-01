"use strict";

function SampleDatabaseController($scope, sampleDatabaseFileManager) {

  $scope.useSample = false;
  sampleDatabaseFileManager.getActive().then(function(isActive) {
    $scope.useSample = isActive;
    $scope.$apply();
  });

  $scope.updateSampleFlag = function() {
    sampleDatabaseFileManager.setActive($scope.useSample)
  }
}
