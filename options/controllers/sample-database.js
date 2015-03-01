"use strict";

function SampleDatabaseController($scope, sampleDatabaseFileManager) {

  $scope.useSample = false;
  chrome.p.storage.local.get('useSampleDatabase').then(function(results) {
    $scope.useSample = !!results.useSampleDatabase;
    $scope.$apply();
  });

  $scope.updateSampleFlag = function() {
    if ($scope.useSample)
      chrome.p.storage.local.set({'useSampleDatabase': $scope.useSample});
    else
      chrome.p.storage.local.remove('useSampleDatabase');
  }
}
