"use strict";

function StartupController($scope, $location, settings, optionsLink, passwordFileStoreFactory) {
  $scope.ready = false;

  var readyPromises = [];
  passwordFileStoreFactory.listProviders('listDatabases').forEach(function(provider) {
    readyPromises.push(provider.listDatabases());
  });

  Promise.all(readyPromises).then(function(filesArrays) {
    var availableFiles = filesArrays.reduce(function(prev, curr) {
      return prev.concat(curr);
    });

    if (availableFiles.length) {
      settings.getCurrentDatabaseChoice().then(function(info) {
        $location.path('/enter-password/' + info.providerKey + '/' + info.passwordFile.title);
      }).catch(function(err) {
        $location.path('/choose-file')
      }).then(function() {
        $scope.$apply();
      });
    } else {
      //no files available - allow then user to link to the options page
      $scope.ready = true;
      $scope.$apply();
    }
  });

  $scope.openOptionsPage = function() {
    optionsLink.go();
  }
}
