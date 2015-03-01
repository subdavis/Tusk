"use strict";

function StartupController($scope, settings) {

  settings.getCurrentDatabaseChoice().then(function(choice) {
    $scope.alreadyChoseDb = (choice == null ? false : true);
  }).then(function() {
    $scope.$apply();
  });
}
