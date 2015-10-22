function ChooseOneDriveFileController($scope, oneDriveFileManager) {
  "use strict";

  $scope.busy = false;
  $scope.authorized = false;

  oneDriveFileManager.isAuthorized().then(function (authorized) {
    $scope.authorized = authorized;
    if (authorized) {
      listDatabases();
    }
  });

  $scope.authorize = function() {
    $scope.busy = true;

    oneDriveFileManager.authorize()
      .then(function () {
        $scope.authorized = true;
        listDatabases();
      })
      .finally(function () {
        $scope.busy = false;
      });
  }

  function listDatabases () {
    $scope.busy = true;

    oneDriveFileManager.listDatabases()
      .then(function (files) {
        $scope.files = files;
      })
      .finally(function () {
        $scope.busy = false;
      })
  }
}
