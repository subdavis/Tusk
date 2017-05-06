'use strict';

function PasswordListController($scope, settings) {
    $scope.settings = {};

    $scope.isExpired = function(entry){  
      // Helper function to determine if entry is expired.
      var d = new Date();
      var milliseconds = d.getTime();
      console.log(entry);
      return entry.expiry >=0 && entry.expiry < milliseconds;
    }

    settings.getPasswordListIconOption().then(function(option) {
        $scope.settings.PasswordListIconOption = option;
    });

    settings.getPasswordListGroupOption().then(function(option) {
        $scope.settings.PasswordListGroupOption = option;
    });
}