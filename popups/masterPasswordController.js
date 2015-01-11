

function MasterPasswordController($scope, $http, gdocs, keepass) {
	$scope.masterPassword = "";

	$scope.enterMasterPassword = function() {
	  keepass.setMasterPassword($scope.masterPassword);

	  $scope.errorMessage = "";
	  $scope.successMessage = "";
	  keepass.getPassword().then(function(entries) {
	    $scope.successMessage = entries.length + " found";
	    $scope.$apply();
	  }).catch(function(err) {
	    $scope.errorMessage = "Incorrect password";
	    $scope.$apply();
	  });

	  /*
		chrome.storage.sync.get('passwordFileName', function(items) {
			if (items.passwordFileName) {

			} else {
				//no password file
			}
		});
		*/
	};

}

MasterPasswordController.$inject = ['$scope', '$http', 'gdocs', 'keepass'];
// For code minifiers.

