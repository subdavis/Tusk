

function MasterPasswordController($scope, $interval, $http, $routeParams, $location, keepass, localStorage) {
	$scope.masterPassword = "";
	$scope.busy = false;
	$scope.fileName = $routeParams.fileTitle;
	$scope.keyFileName = "";
	$scope.rememberKeyFile = true;
  var fileKey, streamKey, bgMessages;

	function bgMessageListener(savedState) {
		//called from the background.
		$scope.entries = savedState.entries;
		angular.forEach($scope.entries, function(entry) {
			//deserialize passwords
			entry.protectedData.Password.data = new Uint8Array(Base64.decode(entry.Base64Password));
		})
		streamKey = Base64.decode(savedState.streamKey);
		$scope.$apply();
	};

	//dispose.  only runs when switching controllers, no need to run when unloading popup:
	$scope.$on("$destroy", function() {
		if (bgMessages) {
			bgMessages.onMessage.removeListener(bgMessageListener);
			bgMessages.disconnect();
		}
	});

  localStorage.getCurrentDatabaseUsage().then(function(usage) {
    //tweak UI based on what we know about the database file
    $scope.hidePassword = (usage.requiresPassword === false);
    $scope.hideKeyFile = (usage.requiresKeyfile === false);
    $scope.rememberKeyFile = !usage.forgetKeyFile;
    if (usage.fileKey && usage.forgetKeyFile !== true) {
      fileKey = usage.fileKey;
      $scope.keyFileName = usage.keyFileName;
    }

    if ($scope.hidePassword && fileKey) {
      $scope.enterMasterPassword();
    } else {
      $scope.$apply();
    }
  });

  //determine current url:
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs.length) {
			$scope.tabId = tabs[0].id;
			var url = tabs[0].url.split('?');
			$scope.url = url[0];
      $scope.title = tabs[0].title;

			var parsedUrl = parseUrl(tabs[0].url);
			$scope.origin = parsedUrl.protocol + '//' + parsedUrl.hostname + '/';

			chrome.p.permissions.contains({origins: [$scope.origin]})
				.then(function() {
					$scope.sitePermission = true;
				})
				.catch(function(err) {
					$scope.sitePermission = false;
				})
				.then(function() {
					$scope.$apply();
				})

			//wake up the background page and get a pipe to send/receive messages:
			bgMessages = chrome.runtime.connect({name: "tab" + $scope.tabId});
			bgMessages.onMessage.addListener(bgMessageListener);
    }
  });

  //---keyfile upload starts...
  $scope.selectFile = function() {
    document.getElementById('file').click();
  };

  $scope.handleKeyFile = function(filePromises) {
    if (filePromises.length != 1) {
      return;
    }

    filePromises[0].then(function(info) {
      var bytes = info.data;
      $scope.keyFileName = info.file.name;

      return keepass.getKeyFromFile(info.data);
    }).then(function(key) {
      fileKey = key;
    }).catch(function(err) {
      $scope.errorMessage = err.message;
    }).then(function() {
      $scope.$apply();
    });
  }
  //---keyfile upload ends...

  $scope.chooseAnotherFile = function() {
    $location.path('/choose-file-type');
  }

	$scope.autofill = function(entry) {
		chrome.runtime.sendMessage({
			m: "requestPermission",
			perms: {
				origins: [$scope.origin]
			},
			then: {
				m:"autofill",
				tabId: $scope.tabId,
				u: entry.UserName,
				p: keepass.getDecryptedEntry(entry.protectedData.Password, streamKey)
			}
		});

		window.close();  //close the popup
	}

	$scope.enterMasterPassword = function() {
	  $scope.clearMessages();
	  $scope.busy = true;

		keepass.getPasswords($scope.masterPassword, fileKey).then(function(entries) {

	    //remember usage for next time:
      localStorage.saveCurrentDatabaseUsage({
        requiresPassword: $scope.masterPassword ? true : false,
        requiresKeyfile: fileKey ? true : false,
        forgetKeyFile: !$scope.rememberKeyFile,
        fileKey: fileKey,
        keyFileName: $scope.keyFileName
      });

      //show results:
	    var siteUrl = parseUrl($scope.url);
	    var siteTokens = getValidTokens(siteUrl.hostname + "." + $scope.title);
	    entries.forEach(function(entry) {
	      //apply a ranking algorithm to find the best matches
				var entryHostName = parseUrl(entry.URL).hostname || "";

				if (entryHostName && entryHostName == siteUrl.hostname)
					entry.matchRank = 100;  //exact url match
				else
	      	entry.matchRank = 0;

	      entry.matchRank += (entry.Title && $scope.title && entry.Title.toLowerCase() == $scope.title.toLowerCase()) ? 1 : 0;
	      entry.matchRank += (entry.Title && entry.Title.toLowerCase() === siteUrl.hostname.toLowerCase()) ? 1: 0;
        entry.matchRank += (entry.URL && siteUrl.hostname.indexOf(entry.URL.toLowerCase()) > -1) ? 0.9: 0;
	      entry.matchRank += (entry.Title && siteUrl.hostname.indexOf(entry.Title.toLowerCase()) > -1) ? 0.9 : 0;

	      var entryTokens = getValidTokens(entryHostName + "." + entry.Title);
	      for (var i=0; i<entryTokens.length; i++) {
					var token1 = entryTokens[i];
					for (var j=0; j<siteTokens.length; j++) {
	          var token2 = siteTokens[j];

	          entry.matchRank += (token1 === token2) ? 0.2 : 0;
	        }
	      }
	    });

	    $scope.entries = entries.filter(function(entry) {
	      return (entry.matchRank >= 100)
	    });
			if ($scope.entries.length == 0) {
				$scope.entries = entries.filter(function(entry) {
					return (entry.matchRank > 0.8 && !entry.URL);  //a good match for an entry without a url
				});
			}
	    if ($scope.entries.length == 0) {
  	    $scope.entries = entries.filter(function(entry) {
  	      return (entry.matchRank >= 0.4);
  	    });

				if ($scope.entries.length) {
					$scope.partialMatchMessage = "No close matches, showing " + $scope.entries.length + " partial matches.";
				}
	    }
	    if ($scope.entries.length == 0) {
	      $scope.errorMessage = "No matches found for this site."
	    }

			angular.forEach($scope.entries, function(entry) {
				//process each entry for serialization
				entry.Base64Password = Base64.encode(entry.protectedData.Password.data);
			});

			bgMessages.postMessage({
				entries: $scope.entries,
				streamKey: Base64.encode(keepass.streamKey)
			});  //save for a brief time in the background page

	    $scope.busy = false;
	  }).catch(function(err) {
	    $scope.errorMessage = err.message || "Incorrect password or key file";
	    $scope.busy = false;
	  }).then(function() {
	    $scope.$apply();
	  });
	};

  $scope.clearMessages = function() {
	  $scope.errorMessage = "";
	  $scope.successMessage = "";
		$scope.partialMatchMessage = "";
  }

  $scope.copyPassword = function(entry) {
    $scope.copyEntry = entry;
    entry.copied = true;
    document.execCommand('copy');
  }

  //listens for the copy event and does the copy
  document.addEventListener('copy', function(e) {
    if (!$scope.copyEntry) {
      return;  //listener can get registered multiple times
    }

    var textToPutOnClipboard = keepass.getDecryptedEntry($scope.copyEntry.protectedData.Password, streamKey);
    $scope.copyEntry = null;
    e.clipboardData.setData('text/plain', textToPutOnClipboard);
    e.preventDefault();

    chrome.alarms.create("clearClipboard", {
      delayInMinutes: 1
    });

    //actual clipboard clearing occurs on the background task via alarm, this is just for user feedback:
    $scope.successMessage = "Copied to clipboard.  Clipboard will clear in 60 seconds."
    var seconds = 60;
    var instance = $interval(function() {
      seconds -= 1;
      if (seconds <= 0) {
        $scope.successMessage = "Clipboard cleared"
        $interval.cancel(instance);
      } else {
        $scope.successMessage = "Copied to clipboard.  Clipboard will clear in " + seconds+ " seconds."
      }
    }, 1000);
  });

	function getValidTokens(tokenString) {
		if (!tokenString) return [];

		return tokenString.toLowerCase().split(/\.|\s|\//).filter(function(token) {
			return (token && token !== "com" && token !== "www" && token.length > 1);
		});
	}

  function parseUrl(url) {
    //from https://gist.github.com/jlong/2428561
    var parser = document.createElement('a');
    parser.href = url;

    /*
    parser.protocol; // => "http:"
    parser.hostname; // => "example.com"
    parser.port;     // => "3000"
    parser.pathname; // => "/pathname/"
    parser.search;   // => "?search=test"
    parser.hash;     // => "#hash"
    parser.host;     // => "example.com:3000"
    */

    return parser;
  }
}
