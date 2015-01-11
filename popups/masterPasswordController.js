

function MasterPasswordController($scope, $http, gdocs, keepass) {
	$scope.masterPassword = "";
	$scope.busy = false;

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs.length) {
      var url = tabs[0].url.split('?');
      $scope.url = url[0];
      $scope.title = tabs[0].title;
      $scope.$apply();
    }
  });

	$scope.enterMasterPassword = function() {
	  $scope.clearMessages();
	  $scope.busy = true;
	  keepass.getPasswords($scope.masterPassword).then(function(entries) {
	    var url = parseUrl($scope.url);
	    $scope.entries = entries.filter(function(entry) {
	      return (entry.URL == url.hostname
	        || (entry.Title && $scope.title && entry.Title.toLowerCase() == $scope.title.toLowerCase())
	        || entry.Title == url.hostname
	        || (entry.URL && url.hostname.indexOf(entry.URL.toLowerCase()) > -1)
	        || (entry.Title && url.hostname.indexOf(entry.Title.toLowerCase()) > -1)
	       );
	    });
	    $scope.successMessage = $scope.entries.length + " matches found";
	    $scope.busy = false;
	    $scope.$apply();
	  }).catch(function(err) {
	    $scope.errorMessage = err.message || "Incorrect password";
	    $scope.busy = false;
	    $scope.$apply();
	  });
	};

  $scope.clearMessages = function() {
	  $scope.errorMessage = "";
	  $scope.successMessage = "";
  }

  $scope.copyPassword = function(entry) {
    $scope.copyEntry = entry;
    document.execCommand('copy');
  }

  document.addEventListener('copy', function(e) {
    var textToPutOnClipboard = $scope.copyEntry.Password;
    e.clipboardData.setData('text/plain', textToPutOnClipboard);
    e.preventDefault();

    chrome.alarms.create("clearClipboard", {
      delayInMinutes: 1
    });
  });

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

MasterPasswordController.$inject = ['$scope', '$http', 'gdocs', 'keepass'];
// For code minifiers.

