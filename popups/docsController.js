

function DocsController($scope, $http, gdocs, keepass) {
	$scope.docs = [];

	$scope.choosePasswordFile = function(doc) {
		chrome.storage.sync.set({'passwordFile': doc}, function() {
  		keepass.setFile(doc.url);
  		$scope.fileName = doc.title;
  		$scope.$apply();
		});
	};

  $scope.chooseAnotherDoc = function() {
    $scope.fetchDocs();
  }

	$scope.clearDocs = function() {
		$scope.docs = [];
		$scope.fileName = "";
	};

	$scope.fetchDocs = function() {
		this.clearDocs();

    $scope.refreshing = true;
    gdocs.getPasswordFiles(true).then(function(docs) {
      $scope.docs = docs.map(function(doc) {
        doc.selected = function() { return (entry.title == $scope.fileName); }
        return doc;
      });
      $scope.refreshing = false;

      $scope.$apply();
    }).catch(function(err) {
      $scope.errorMessage = err;
      $scope.refreshing = false;
    });
	};

	// Toggles the authorization state.
	$scope.toggleAuth = function(interactive) {
		if (!gdocs.accessToken) {
			gdocs.auth(interactive).then(function() {
				$scope.fetchDocs(false);
			});
		} else {
			gdocs.revokeAuthToken();
			this.clearDocs();
		}
	};

	$scope.authorized = function() {
	  return (gdocs.accessToken) ? true : false;
	}

	$scope.toggleAuth(false);

	chrome.storage.sync.get('passwordFile', function(items) {
		if (items.passwordFile) {
			$scope.fileName = items.passwordFile.title;
			keepass.setFile(items.passwordFile.url);
			$scope.$apply();
		}
	});
}

DocsController.$inject = ['$scope', '$http', 'gdocs', 'keepass'];
// For code minifiers.

