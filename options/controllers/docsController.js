"use strict";

function DocsController($scope, googleDrivePasswordFileManager) {
  $scope.docs = [];

  $scope.refresh = function() {
    $scope.docs = [];
    $scope.refreshing = true;
    $scope.errorMessage = "";
    googleDrivePasswordFileManager.interactiveRequestAuth().then(function() {
      return googleDrivePasswordFileManager.listDatabases();
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
    $scope.errorMessage = "";
    $scope.requestingUrl = true;
    requestGoogleUrlPermissions(true).then(function() {
      $scope.requestingUrl = false;
      $scope.requestingDriveAccess = true;
      $scope.$apply();
      return googleDrivePasswordFileManager.interactiveRequestAuth();
    }).then(function() {
      $scope.requestingDriveAccess = false;
      $scope.$apply();
      return googleDrivePasswordFileManager.listDatabases();
    }).then(function(docs) {
      $scope.docs = docs;
    }).catch(function(err) {
      $scope.errorMessage = err.message || "Error authorizing"
    }).then(function() {
      $scope.requestingUrl = false;
      $scope.requestingDriveAccess = false;
      $scope.refreshing = false;
      $scope.$apply();
    });
  };

  $scope.logout = function() {
    $scope.errorMessage = "";
    googleDrivePasswordFileManager.revokeAuth().then(function() {
      $scope.$apply();
    });
  };

  //returns true if user is authenticated to google docs
  $scope.authorized = function() {
    return googleDrivePasswordFileManager.isAuthorized();
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
        "https://www.googleapis.com/",
        "https://accounts.google.com/"
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
  googleDrivePasswordFileManager.listDatabases().then(function(docs) {
    $scope.docs = docs;
  }).catch(function(err) {
    $scope.errorMessage = ""; //clear the message because we don't want to show errors on startup
  }).then(function() {
    $scope.refreshing = false;
    $scope.$apply();
  })

}
