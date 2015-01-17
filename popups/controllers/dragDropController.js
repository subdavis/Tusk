

function DragDropController($scope, $http, $location) {
  $scope.files = [];
  $scope.handleDrop = function(filePromises) {

    filePromises.forEach(function(filePromise) {
      filePromise.then(function(info) {
        $scope.files.push(info.file);
        $scope.$apply();
      })
    });

    $scope.success = "woohoo";
  }
}
