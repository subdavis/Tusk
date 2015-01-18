

function DragDropController($scope, $http, $location) {
  $scope.files = [];

  $scope.handleDrop = function(filePromises) {
    $scope.errorMessage = "";
    $scope.loadedFiles = 0;
    filePromises.forEach(function(filePromise) {
      filePromise.then(function(info) {
        if (info.file.name.indexOf('.kdbx') < 0 || info.file.size < 70) {
          $scope.errorMessage += info.file.name + " is not a valid KeePass v2 file. "
          return;
        }

        var fi = {
          title: info.file.name,
          lastModified: info.file.lastModified,
          lastModifiedDate: info.file.lastModifiedDate,
          size: info.file.size,
          type: info.file.type,
          data: StringView.bytesToBase64(new Uint8Array(info.data))
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
      chrome.storage.local.set({"passwordFiles": $scope.files });
      $scope.$apply();
    });
  };

  $scope.removePasswordFile = function(fi) {
    $scope.files = $scope.files.filter(function(existingFi) {
      return (existingFi.title != fi.title);
    });

    chrome.storage.local.set({"passwordFiles": $scope.files });
  };

  $scope.choosePasswordFile = function(fi) {

  };

  //chrome.storage.local.clear(function() {
    chrome.storage.local.get('passwordFiles', function(result) {
  		if (result && result.passwordFiles) {
  		  $scope.files = result.passwordFiles;
  		  $scope.$apply();
  		}
    });
  //});
}
