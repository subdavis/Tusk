

function FileTypeController($scope, $http, $location) {

  $scope.chooseGdrive = function() {
    $location.path('/choose-file');
  }

  $scope.chooseDragDrop = function() {
    $location.path('/drag-drop-file');
  }
}
