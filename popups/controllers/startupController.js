

function StartupController($scope, $http, $location, gdocs, localStorage) {

  localStorage.getSavedPasswordChoice().then(function(fileStore) {
  	$location.path('/enter-password/' + fileStore.title);
  	$scope.$apply();
  }).catch(function(err) {
	  $location.path('/choose-file-type');
		$scope.$apply();
  })

  //trigger gdocs auth - doesn't matter if it succeeds or fails, we just want a token ready to go
  gdocs.auth();

}


