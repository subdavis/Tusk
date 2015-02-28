"use strict";

function StartupController($scope, $http, $location, gdocs, localStorage, optionsLink) {
  $scope.ready = false;

  var p1 = gdocs.auth().then(function() {
    return gdocs.getPasswordFiles(true);
  }).catch(function(err) {
    return [];
  });
  var p2 = chrome.p.storage.local.get('passwordFiles').then(function(result) {
    return result.passwordFiles || [];
  });

  Promise.all([p1, p2]).then(function(filesArrays) {
    var availableFiles = filesArrays.reduce(function(prev, curr) {
      return prev.concat(curr);
    });

    if (availableFiles.length) {
      localStorage.getSavedDatabaseChoice().then(function(fileStore) {
        $location.path('/enter-password/' + fileStore.title);
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
