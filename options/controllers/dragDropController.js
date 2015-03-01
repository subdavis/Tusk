"use strict";

function DragDropController($scope, localChromePasswordFileManager) {
  $scope.files = [];

  $scope.selectFile = function() {
    document.getElementById('file').click();
  };

  $scope.handleDrop = function(filePromises) {
    $scope.errorMessage = "";
    $scope.loadedFiles = 0;
    filePromises.forEach(function(filePromise) {
      filePromise.then(function(info) {
        if (info.file.name.indexOf('.kdb') < 0 || info.file.size < 70) {
          $scope.errorMessage += info.file.name + " is not a valid KeePass file. "
          return;
        }

        var fi = {
          title: info.file.name,
          lastModified: info.file.lastModified,
          lastModifiedDate: info.file.lastModifiedDate,
          size: info.file.size,
          type: info.file.type,
          data: Base64.encode(info.data)
        }

        var existingIndex = null;
        $scope.files.forEach(function(existingFi, index) {
          if (existingFi.title == fi.title) {
            existingIndex = index;
          }
        });

        if (existingIndex == null) {
          //add
          $scope.files.push(fi);
        } else {
          //replace
          $scope.files[existingIndex] = fi;
        }

        $scope.loadedFiles += 1;

        return fi;
      }).then(function(fi) {
        return localChromePasswordFileManager.saveDatabase({
          title: fi.title,
          data: fi.data,
          lastModified: fi.lastModified
        });
      })
    });

    Promise.all(filePromises).then(function() {
      $scope.$apply();
    });
  };

  $scope.removePasswordFile = function(fi) {
    localChromePasswordFileManager.deleteDatabase(fi).then(function() {
      return localChromePasswordFileManager.listDatabases();
    }).then(function(files) {
      $scope.loadedFiles = 0;
      $scope.files = files;
      $scope.$apply();
    })
  };

  localChromePasswordFileManager.listDatabases().then(function(files) {
    $scope.files = files;
    $scope.$apply();
  });
}
