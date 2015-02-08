"use strict";

function MasterPasswordController($scope, $interval, $http, $routeParams, $location, keepass, localStorage, protectedMemory, unlockedState) {
  $scope.masterPassword = "";
  $scope.busy = false;
  $scope.fileName = $routeParams.fileTitle;
  $scope.keyFileName = "";
  $scope.rememberKeyFile = true;
  $scope.unlockedState = unlockedState;
  //$scope.usingSavedState = false;
  var fileKey;

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

  //determine current tab info:
  unlockedState.getTabDetails().then(function() {
    $scope.$apply();
  });

  //react to received message
  unlockedState.messagePromise.then(function() {
    $scope.$apply();
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

      protectedMemory.setData("cachedEntries", entries);   //save all entries in case user wants to do a custom search

      //show results:
      var siteUrl = parseUrl($scope.url);
      var siteTokens = getValidTokens(siteUrl.hostname + "." + $scope.title);
      entries.forEach(function(entry) {
        //apply a ranking algorithm to find the best matches
        var entryHostName = parseUrl(entry.URL).hostname || "";

        if (entryHostName && entryHostName == siteUrl.hostname)
          entry.matchRank = 100; //exact url match
        else
          entry.matchRank = 0;

        entry.matchRank += (entry.Title && $scope.title && entry.Title.toLowerCase() == $scope.title.toLowerCase()) ? 1 : 0;
        entry.matchRank += (entry.Title && entry.Title.toLowerCase() === siteUrl.hostname.toLowerCase()) ? 1 : 0;
        entry.matchRank += (entry.URL && siteUrl.hostname.indexOf(entry.URL.toLowerCase()) > -1) ? 0.9 : 0;
        entry.matchRank += (entry.Title && siteUrl.hostname.indexOf(entry.Title.toLowerCase()) > -1) ? 0.9 : 0;

        var entryTokens = getValidTokens(entryHostName + "." + entry.Title);
        for (var i = 0; i < entryTokens.length; i++) {
          var token1 = entryTokens[i];
          for (var j = 0; j < siteTokens.length; j++) {
            var token2 = siteTokens[j];

            entry.matchRank += (token1 === token2) ? 0.2 : 0;
          }
        }
      });

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

      unlockedState.saveBackgroundState({
        entries: unlockedState.entries,
        streamKey: keepass.streamKey
      });

      $scope.busy = false;
    }).catch(function(err) {
      $scope.errorMessage = err.message || "Incorrect password or key file";
      $scope.busy = false;
    }).then(function() {
      $scope.$apply();
    });
  };

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
