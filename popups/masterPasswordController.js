

function MasterPasswordController($scope, $http, gdocs, keepass) {
	$scope.masterPassword = "";
	$scope.busy = false;

	$scope.enterMasterPassword = function() {
	  $scope.clearMessages();
	  $scope.busy = true;
	  keepass.getPasswords($scope.masterPassword).then(function(entries) {
	    $scope.successMessage = entries.length + " passwords found";
	    $scope.busy = false;
	    $scope.$apply();
	  }).catch(function(err) {
	    $scope.errorMessage = "Incorrect password";
	    $scope.busy = false;
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

  $scope.clearMessages = function() {
	  $scope.errorMessage = "";
	  $scope.successMessage = "";
  }
}

MasterPasswordController.$inject = ['$scope', '$http', 'gdocs', 'keepass'];
// For code minifiers.

