"use strict";

function ManageKeyFilesController($scope, settings, keyFileParser) {

  loadKeyFiles();
  function loadKeyFiles() {
    settings.getKeyFiles().then(function(files) {
      $scope.$apply(function() {
        $scope.keyFiles = files;
      });
    })
  }

  $scope.removeKeyFile = function(keyFile) {
    settings.deleteKeyFile(keyFile.name).then(function() {
      loadKeyFiles();
    })
  }

  //---keyfile upload starts...
  $scope.selectFile = function() {
    document.getElementById('file').click();
  };

  $scope.handleKeyFile = function(filePromises) {
    $scope.errorMessage = "";
    if (filePromises.length != 1) {
      return;
    }

    filePromises[0].then(function(info) {
      return keyFileParser.getKeyFromFile(info.data).then(function(key) {
        return settings.addKeyFile(info.file.name, key);
      }).then(function() {
        loadKeyFiles();
      });
    }).catch(function(err) {
      $scope.errorMessage = err.message;
      $scope.$apply();
    });
  }
  //---keyfile upload ends...

}
