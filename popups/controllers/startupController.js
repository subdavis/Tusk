"use strict";

function StartupController($scope, $location, settings, optionsLink, passwordFileStoreRegistry) {
  $scope.ready = false;

  settings.getCurrentDatabaseChoice().then(function(info) {
    //use the last chosen database
    $location.path('/enter-password/' + info.providerKey + '/' + info.passwordFile.title);
  }).catch(function(err) {
    //user has not yet chosen a database.  Lets see if there are any available to choose...
    var readyPromises = [];
    passwordFileStoreRegistry.listProviders('listDatabases').forEach(function(provider) {
      readyPromises.push(provider.listDatabases());
    });

    return Promise.all(readyPromises).then(function(filesArrays) {
      var availableFiles = filesArrays.reduce(function(prev, curr) {
        return prev.concat(curr);
      });

      if (availableFiles.length) {
        //choose one of the files
        $location.path('/choose-file')
      } else {
        //no files available - allow the user to link to the options page
        $scope.ready = true;
      }
    });
  }).then(function() {
    $scope.$apply();
  })

  $scope.openOptionsPage = function() {
    optionsLink.go();
  }
}
