

function StartupController($scope, $http, $location, gdocs, keepass) {

  gdocs.auth(false).then(function() {
  	chrome.storage.sync.get('passwordFile', function(items) {
  		if (items.passwordFile) {
  			keepass.setFile(items.passwordFile);
  		  $location.path('/enter-password/' + items.passwordFile.title);
  		} else {
  		  $location.path('/choose-file-type');
  		}
  		$scope.$apply();
  	});
  }).catch(function(err) {
	  $location.path('/choose-file-type');
		$scope.$apply();
  })

}


