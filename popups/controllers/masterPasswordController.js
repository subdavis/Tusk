"use strict";

function MasterPasswordController($scope, $interval, $http, $routeParams, $location, keepass, localStorage, unlockedState, secureCache, settings, optionsLink) {
  $scope.masterPassword = "";
  $scope.busy = false;
  $scope.fileName = $routeParams.fileTitle;
  $scope.selectedKeyFile = null;
  $scope.unlockedState = unlockedState;
  $scope.os = {};

  chrome.runtime.getPlatformInfo(function(info) {
    $scope.$apply(function() {
      $scope.os[info.os] = true;
    })
  });

  settings.getKeyFiles().then(function(keyFiles) {
    $scope.keyFiles = keyFiles;
  }).then(function() {
    return localStorage.getCurrentDatabaseUsage();
  }).then(function(usage) {
    //tweak UI based on what we know about the database file
    $scope.hidePassword = (usage.requiresPassword === false);
    $scope.hideKeyFile = (usage.requiresKeyfile === false);

    if (usage.keyFileName) {
      var matches = $scope.keyFiles.filter(function(keyFile) {
        return keyFile.name == usage.keyFileName;
      })

      if (matches.length) {
        $scope.selectedKeyFile = matches[0];
      }
    }

    if ($scope.hidePassword && $scope.selectedKeyFile) {
      //key file selected and we have a file key already - auto-unlock
      $scope.enterMasterPassword();
    }
  }).then(function() {
    $scope.$apply();
  });

  //determine current tab info:
  unlockedState.getTabDetails().then(function() {
    $scope.$apply();
  });

  //get entries from secure cache
  secureCache.get('entries').then(function(entries) {
    if (entries && entries.length) {
      return secureCache.get('streamKey').then(function(streamKey) {
        showResults(entries, streamKey);
        $scope.$apply();
      })
    }
  }).catch(function(err) {
    //this is fine - it just means the cache expired.  Clear the cache to be sure.
    secureCache.clear('entries');
    secureCache.clear('streamKey');
  });

  //go to the options page to manage key files
  $scope.manageKeyFiles = function() {
    optionsLink.go();
  }

  $scope.chooseAnotherFile = function() {
    unlockedState.clearBackgroundState();
    secureCache.clear('entries');
    secureCache.clear('streamKey');
    $location.path('/choose-file-type');
  }

  $scope.enterMasterPassword = function() {
    $scope.clearMessages();
    $scope.busy = true;

    keepass.getPasswords($scope.masterPassword, $scope.selectedKeyFile).then(function(entries) {
      //remember usage for next time:
      localStorage.saveCurrentDatabaseUsage({
        requiresPassword: $scope.masterPassword ? true : false,
        requiresKeyfile: $scope.selectedKeyFile ? true : false,
        keyFileName: $scope.selectedKeyFile ? $scope.selectedKeyFile.name : ""
      });

      //show results:
      showResults(entries, keepass.streamKey);

      $scope.busy = false;
    }).catch(function(err) {
      $scope.errorMessage = err.message || "Incorrect password or key file";
      $scope.busy = false;
    }).then(function() {
      $scope.$apply();
    });
  };

  function showResults(entries, streamKey) {
    var siteUrl = parseUrl(unlockedState.url);
    var siteTokens = getValidTokens(siteUrl.hostname + "." + unlockedState.title);
    entries.forEach(function(entry) {
      //apply a ranking algorithm to find the best matches
      var entryHostName = parseUrl(entry.url).hostname || "";

      if (entryHostName && entryHostName == siteUrl.hostname)
        entry.matchRank = 100; //exact url match
      else
        entry.matchRank = 0;

      entry.matchRank += (entry.title && unlockedState.title && entry.title.toLowerCase() == unlockedState.title.toLowerCase()) ? 1 : 0;
      entry.matchRank += (entry.title && entry.title.toLowerCase() === siteUrl.hostname.toLowerCase()) ? 1 : 0;
      entry.matchRank += (entry.url && siteUrl.hostname.indexOf(entry.url.toLowerCase()) > -1) ? 0.9 : 0;
      entry.matchRank += (entry.title && siteUrl.hostname.indexOf(entry.title.toLowerCase()) > -1) ? 0.9 : 0;

      var entryTokens = getValidTokens(entryHostName + "." + entry.title);
      for (var i = 0; i < entryTokens.length; i++) {
        var token1 = entryTokens[i];
        for (var j = 0; j < siteTokens.length; j++) {
          var token2 = siteTokens[j];

          entry.matchRank += (token1 === token2) ? 0.2 : 0;
        }
      }
    });

    //save short term (in-memory) filtered results
    unlockedState.entries = entries.filter(function(entry) {
      return (entry.matchRank >= 100)
    });
    if (unlockedState.entries.length == 0) {
      unlockedState.entries = entries.filter(function(entry) {
        return (entry.matchRank > 0.8 && !entry.URL); //a good match for an entry without a url
      });
    }
    if (unlockedState.entries.length == 0) {
      unlockedState.entries = entries.filter(function(entry) {
        return (entry.matchRank >= 0.4);
      });

      if (unlockedState.entries.length) {
        $scope.partialMatchMessage = "No close matches, showing " + unlockedState.entries.length + " partial matches.";
      }
    }
    if (unlockedState.entries.length == 0) {
      $scope.errorMessage = "No matches found for this site."
    }
    unlockedState.streamKey = streamKey;

    //save longer term (in encrypted storage)
    secureCache.save('entries', entries);
    secureCache.save('streamKey', streamKey);
  }

  $scope.findManually = function() {
    $location.path('/find-entry');
  }

  $scope.clearMessages = function() {
    $scope.errorMessage = "";
    $scope.successMessage = "";
    $scope.partialMatchMessage = "";
  }

  function getValidTokens(tokenString) {
    if (!tokenString) return [];

    return tokenString.toLowerCase().split(/\.|\s|\//).filter(function(token) {
      return (token && token !== "com" && token !== "www" && token.length > 1);
    });
  }

  function parseUrl(url) {
    if (url && !url.indexOf('http') == 0)
      url = 'http://' + url;

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
