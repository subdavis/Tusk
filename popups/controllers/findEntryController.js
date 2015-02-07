function FindEntryController($scope, protectedData) {

  protectedData.getData('lastEntries').then(function(entries) {
    $scope.entries = entries;
    $scope.$apply();
  });
}
