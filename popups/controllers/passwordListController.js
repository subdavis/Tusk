'use strict';

function PasswordListController($scope, settings) {
    $scope.settings = {};

    settings.getPasswordListIconOption().then(function(option) {
        $scope.settings.PasswordListIconOption = option;
    });

    settings.getPasswordListGroupOption().then(function(option) {
        $scope.settings.PasswordListGroupOption = option;
    });
}