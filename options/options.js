/**

The MIT License (MIT)

Copyright (c) 2015 Steven Campbell.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var keepassSettings = angular.module('keepassSettings', ['ngAnimate', 'jsonFormatter']);

function OptionsController($scope, $http) {

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

keepassSettings.directive('icon', function() {
  function link(scope, element, attrs) {
    function renderSVG() {
      var icon = element.scope()[attrs.p]; //evaluate as scope expression
      if (!icon)
        icon = attrs.p;
      var html = '<svg class="icon ' + icon + '"><use xlink:href="#' + icon + '"></use></svg>';
      element.replaceWith(html);
    }

    renderSVG();
  }

  return {
    link: link,
    restrict: 'E'
  };
});