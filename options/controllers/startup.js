"use strict";

function StartupController($scope, $location) {
  Promise.all([checkForData()]).then(function() {
    $scope.$apply();
  })

  $scope.hasData = false;
  function checkForData() {
    if ($location.search().stay) return;  //accessed via menu, don't autoredirect
    
    return chrome.p.storage.local.get(null).then(function(items) {
      $scope.hasData = true;
    }).then(function() {
      if ($scope.hasData) {
        //redirect to manage key files
        $location.path('/keyFiles');
      }
    });
  }

}
