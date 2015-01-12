

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
    $scope.fileName = "";
    $scope.fetchDocs();
  }

	$scope.fetchDocs = function() {
		$scope.docs = [];
    $scope.refreshing = true;

    gdocs.getPasswordFiles(true).then(function(docs) {
      $scope.docs = docs.map(function(doc) {
        doc.selected = function() { return (entry.title == $scope.fileName); }
        return doc;
      });

      $scope.refreshing = false;
      $scope.errorMessage = "";
      $scope.$apply();
    }).catch(function(err) {
      $scope.errorMessage = err.message || "Unknown Error";
      $scope.refreshing = false;
    });
	};

	// Toggles the authorization state.
	$scope.toggleAuth = function(interactive) {
	  requestGoogleUrlPermissions(interactive).then(function() {
  		if (!gdocs.accessToken) {
  			gdocs.auth(interactive).then(function() {
  				$scope.fetchDocs(false);
  			});
  		} else {
  			gdocs.revokeAuthToken();
  			$scope.docs = [];
  		}
	  }).catch(function(err) {
	    $scope.errorMessage = "Unable to continue unless you grant permissions";
	    $scope.$apply();
	  });
	};

	$scope.authorized = function() {
	  return (gdocs.accessToken) ? true : false;
	}

	function requestGoogleUrlPermissions(interactive) {
	  if (!interactive) {
	    return Promise.resolve();   //can only request permission if it is interactive
	  }

    var resolve, reject;
    var p = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });

	  chrome.permissions.request({
      origins: [
        "https://docs.google.com/feeds/",
        "https://docs.googleusercontent.com/",
        "https://spreadsheets.google.com/feeds/",
        "https://ssl.gstatic.com/",
        "https://www.googleapis.com/"
    	]
    }, function(granted) {
      // The callback argument will be true if the user granted the permissions.
      if (granted) {
        resolve();
      } else {
        reject(new Error('User denied access to google docs urls'));
      }
    });

    return p;
	}

	$scope.toggleAuth(false);

	chrome.storage.sync.get('passwordFile', function(items) {
	  console.log(items);
		if (items.passwordFile) {
			$scope.fileName = items.passwordFile.title;
			keepass.setFile(items.passwordFile.url);
			$scope.$apply();
		}
	});

}

DocsController.$inject = ['$scope', '$http', 'gdocs', 'keepass'];
// For code minifiers.

