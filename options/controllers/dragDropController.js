"use strict";

function DragDropController($scope, $http, $location, localStorage) {
  $scope.files = [];
  var backwardCompatibleVersion = 1; //missing version or version less than this is ignored due missing info or bugs in old storage
  var currentVersion = 1; //current version

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
          storageVersion: currentVersion,
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
      })
    });

    Promise.all(filePromises).then(function(info) {
      //save files in chrome storage
      chrome.storage.local.set({
        "passwordFiles": $scope.files
      });
      $scope.$apply();
    });
  };

  $scope.removePasswordFile = function(fi) {
    $scope.files = $scope.files.filter(function(existingFi) {
      return (existingFi.title != fi.title);
    });

    chrome.storage.local.set({
      "passwordFiles": $scope.files
    });
    $scope.loadedFiles = 0;
  };

  $scope.choosePasswordFile = function(fi) {
    localStorage.saveDatabaseChoice("local", fi).then(function(fileStore) {
      $location.path('/enter-password/' + fileStore.title);
      $scope.$apply();
    });
  };

  chrome.storage.local.get('passwordFiles', function(result) {
    if (result && result.passwordFiles) {
      $scope.files = result.passwordFiles.filter(function(fi) {
        return (fi.storageVersion && fi.storageVersion >= backwardCompatibleVersion);
      });

      $scope.$apply();
    }
  });
}
