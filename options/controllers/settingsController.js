'use strict';

function SettingsController($scope, settings) {
    $scope.settings = {};

    settings.getPasswordListIconOption().then(function(option) {
        $scope.settings.PasswordListIconOption = option;
    });    
    
    settings.getPasswordListGroupOption().then(function(option) {
        $scope.settings.PasswordListGroupOption = option;
    });

    $scope.saveSettings = function() {
  	    Object.keys($scope.settings).forEach(function(setting) {
            if (typeof settings['set' + setting] === 'function') {
                settings['set' + setting]($scope.settings[setting]);
            }
        });
    }
}
