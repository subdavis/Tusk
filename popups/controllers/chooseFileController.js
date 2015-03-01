"use strict";

function ChooseFileController($scope, $location, passwordFileStoreRegistry, settings) {
  $scope.errorMessage = "";
  $scope.successMessage = "";
  $scope.databases = [];

  passwordFileStoreRegistry.listFileManagers('listDatabases').forEach(function(provider) {
    provider.listDatabases().then(function(databases) {
      databases.forEach(function(database) {
        database.provider = provider;
      });
      $scope.databases = $scope.databases.concat(databases);
    }).then(function() {
      $scope.$apply();
    });
  });

  $scope.chooseDatabase = function(database) {
    settings.saveCurrentDatabaseChoice(database, database.provider).then(function() {
      $location.path('/enter-password/' + database.provider.key + '/' + database.title);
      $scope.$apply();
    });
  }
}
