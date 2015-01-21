

function FileTypeController($scope, $http, $location, $routeParams) {

  $scope.chooseGdrive = function() {
    $location.path('/choose-file');
  }

  $scope.chooseDragDrop = function() {
    $location.path('/drag-drop-file');
  }

  $scope.ingognito = chrome.extension.inIncognitoContext;

  $scope.os = {};
  chrome.runtime.getPlatformInfo(function(info) {
    $scope.os[info.os] = true;
  });
}
