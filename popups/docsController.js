

function DocsController($scope, $http, gdocs, keepass) {
	$scope.docs = [];

	// Response handler that caches file icons in the filesystem API.
	function successCallbackWithFsCaching(resp, status, headers, config) {
		var totalEntries = resp.items.length;

		resp.items.forEach(function(entry, i) {
			var doc = {
				title : entry.title,
				updatedDate : Util.formatDate(entry.modifiedDate),
				updatedDateFull : entry.modifiedDate,
				icon : entry.iconLink,
				url : entry.selfLink,
				size : entry.fileSize ? '( ' + entry.fileSize + ' bytes)' : null,
				selected : function() { return (entry.title == $scope.fileName); }
			};

			$scope.docs.push(doc);

			// Only want to sort and call $apply() when we have all entries.
			if (totalEntries - 1 == i) {
				$scope.docs.sort(Util.sortByDate);
			}
		});
	}

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
		// Clear out old results.
	};

	$scope.fetchDocs = function(retry) {
		this.clearDocs();

		if (gdocs.accessToken) {
			var config = {
				params : {
					'alt' : 'json'
				},
				headers : {
					'Authorization' : 'Bearer ' + gdocs.accessToken
				}
			};

			$http.get(gdocs.DOCLIST_FEED + "?q=fileExtension='kdbx'", config)
			.success(successCallbackWithFsCaching)
			.error(function(data, status, headers, config) {
				if (status == 401 && retry) {
					gdocs.removeCachedAuthToken(gdocs.auth.bind(gdocs, true, $scope.fetchDocs.bind($scope, false)));
				}
			});
		}
	};

	// Toggles the authorization state.
	$scope.toggleAuth = function(interactive) {
		if (!gdocs.accessToken) {
			gdocs.auth(interactive, function() {
				$scope.fetchDocs(false);
			});
		} else {
			gdocs.revokeAuthToken(function() {});
			this.clearDocs();
		}
	};

	// Controls the label of the authorize/deauthorize button.
	$scope.authButtonLabel = function() {
		if (gdocs.accessToken)
			return 'Deauthorize';
		else
			return 'Authorize';
	};

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

