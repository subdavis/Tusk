"use strict";

function StoredDataController($scope) {
  Promise.all([refreshLocalStorage(), refreshSyncStorage(), refreshPermissions()]).then(function() {
    $scope.$apply();
  })

  function refreshLocalStorage() {
    $scope.localData = [];
    return chrome.p.storage.local.get(null).then(function(items) {
      for (var name in items) {
        var entry = {
          key: name,
          data: items[name]
        };

        $scope.localData.push(entry);
      }
    });
  }

  function refreshSyncStorage() {
    $scope.syncData = [];
    return chrome.p.storage.sync.get(null).then(function(items) {
      for (var name in items) {
        var entry = {
          key: name,
          data: items[name]
        };

        $scope.syncData.push(entry);
      }
    });
  }

  function refreshPermissions() {
    $scope.permissions = {};
    return chrome.p.permissions.getAll().then(function(perms) {
      $scope.permissions = perms;
    });
  }

  $scope.deleteLocalData = function(key) {
    chrome.p.storage.local.remove(key).then(function() {
      return refreshLocalStorage();
    }).then(function() {
      $scope.$apply();
    });
  }

  $scope.deleteOriginPermission = function(origin) {
    chrome.p.permissions.remove({
      "origins": [origin]
    }).then(function() {
      return refreshPermissions();
    }).then(function() {
      $scope.$apply();
    })
  }
}
