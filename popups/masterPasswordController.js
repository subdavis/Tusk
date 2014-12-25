

function MasterPasswordController($scope, $http, gdocs, keepass) {
	$scope.masterPassword = "";

	$scope.enterMasterPassword = function() {
	  keepass.setMasterPassword($scope.masterPassword);
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

