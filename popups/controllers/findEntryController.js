"use strict";

function FindEntryController($scope, protectedData, unlockedState) {
  $scope.filter = "";
  $scope.unlockedState = unlockedState;

  protectedData.getData('cachedEntries').then(function(entries) {
    $scope.entries = entries;
    $scope.allEntries = entries;
    createEntryFilters(entries);
    $scope.$apply();
  });

  $scope.filterKey = function() {
    if (!$scope.filter) {
      $scope.entries = $scope.allEntries;
      return;
    }
    var filter = $scope.filter.toLocaleLowerCase();
    $scope.entries = $scope.allEntries.filter(function(entry) {
      return (entry.filterKey.indexOf(filter) > -1);
    });
  }

  function createEntryFilters(entries) {
    entries.forEach(function(entry) {
      var filters = new Array();
      collectFilters(entry, filters);
      entry.filterKey = filters.join(" ");
    });
  }

  function collectFilters(data, collector) {
    if (data === null || data === undefined)
      return data;

    if (data.constructor == ArrayBuffer || data.constructor == Uint8Array) {
      return null;
    } else if (typeof (data) === 'string') {
      collector.push(data.toLocaleLowerCase());
    } else if (data.constructor == Array) {
      for(var i=0; i<data.length; i++) {
        collectFilters(data[i], collector);
      }
    } else {
      for(var prop in data) {
        collectFilters(data[prop], collector);
      }
    }
  }
}
