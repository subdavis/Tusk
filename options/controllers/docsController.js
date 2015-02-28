"use strict";

function DocsController($scope, $http, $location, gdocs, localStorage) {
  $scope.docs = [];

  $scope.choosePasswordFile = function(doc) {
    localStorage.saveDatabaseChoice("gdrive", doc).then(function(fileStore) {
      $location.path('/enter-password/' + fileStore.title);
      $scope.$apply();
    });
  };

  $scope.refresh = function() {
    $scope.docs = [];
    $scope.refreshing = true;
    gdocs.auth(true).then(function() {
      return gdocs.getPasswordFiles(true);
    }).then(function(docs) {
      $scope.docs = docs;
      $scope.errorMessage = "";
    }).catch(function(err) {
      $scope.errorMessage = err.message || "Unknown Error";
    }).then(function() {
      $scope.refreshing = false;
      $scope.$apply();
    });
  }

  //authorizes and fetches the docs
  $scope.authorize = function() {
    $scope.refreshing = true;
    requestGoogleUrlPermissions(true).then(function() {
      return gdocs.auth(true);
    }).then(function() {
      return gdocs.getPasswordFiles(true);
    }).then(function(docs) {
      $scope.docs = docs;
    }).catch(function(err) {
      $scope.errorMessage = err.message || "Error authorizing"
    }).then(function() {
      $scope.refreshing = false;
      $scope.$apply();
    });
  };

  $scope.logout = function() {
    gdocs.revokeAuthToken().then(function() {
      $scope.$apply();
    });
  };

  //returns true if user is authenticated to google docs
  $scope.authorized = function() {
    return (gdocs.accessToken) ? true : false;
  }

  //requests permissions to google urls
  function requestGoogleUrlPermissions() {
    var resolve, reject;
    var p = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });

    chrome.permissions.request({
      origins: [
        "https://www.googleapis.com/"
      ]
    }, function(granted) {
      // The callback argument will be true if the user granted the permissions.
      if (granted) {
        resolve();
      } else {
        reject(new Error('User denied access to google docs urls'));
      }
    });

    return p;
  }

  //init:
  $scope.refreshing = true;
  gdocs.auth(false).then(function() {
    return gdocs.getPasswordFiles(true);
  }).then(function(docs) {
    $scope.docs = docs;
  }).catch(function(err) {
    $scope.errorMessage = ""; //clear the message because we don't want to show errors on startup
  }).then(function() {
    $scope.refreshing = false;
    $scope.$apply();
  })

}
