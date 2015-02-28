
"use strict";

function SettingsLinkController($scope, $location, optionsLink) {
  $scope.showSettingsPage = function() {
    optionsLink.go();
  }
}
