function MasterPasswordController($scope, $routeParams, $location, keepass, unlockedState, secureCache, settings, optionsLink) {
	"use strict";

  $scope.masterPassword = "";
  $scope.busy = false;
  $scope.fileName = decodeURIComponent($routeParams.fileTitle);
  $scope.providerKey = $routeParams.providerKey;
  $scope.selectedKeyFile;
  $scope.unlockedState = unlockedState;
  $scope.os = {};

  chrome.runtime.getPlatformInfo(function(info) {
    $scope.$apply(function() {
      $scope.os[info.os] = true;
    })
  });
  
  $scope.setRememberPeriod = function(time_int) {
    /* Args: optional time_int
     * if time_int is given, derive slider_int
     * else assume slider_int is alread set.
     */
    let slider_options = [
      {time: 0,  text: "Do not remember"},
      {time: 30, text: "Remember for 30 min."},
      {time: 120,  text: "Remember for 2 hours."},
      {time: 240,  text: "Remember for 4 hours."},
      {time: 480,  text: "Remember for 8 hours."},
      {time: 1440, text: "Remember for 24 hours."},
      {time: -1, text: "Remember forever."}
    ];

    let slider_option_index;
    if (time_int !== undefined) {
      $scope.slider_int = (t => {
        for (let i=0; i < slider_options.length; i++){
          if (slider_options[i].time === t)
            return i;
        }
        return 0;
      })(time_int);
      slider_option_index = $scope.slider_int;
    } else {
      slider_option_index = parseInt($scope.slider_int);
    }
    if (slider_option_index < slider_options.length){
      $scope.rememberPassword = slider_option_index > 0 ? true : false;
      $scope.rememberPeriod = slider_options[slider_option_index].time;
      $scope.rememberPeriodText = slider_options[slider_option_index].text;
    }
  }

  $scope.findManually = function() {
    $location.path('/find-entry');
  }

  $scope.clearMessages = function() {
    $scope.errorMessage = "";
    $scope.partialMatchMessage = "";
  }

  $scope.forgetPassword = function() {
    settings.saveCurrentDatabaseUsage({
     requiresKeyfile: $scope.selectedKeyFile ? true : false,
     keyFileName: $scope.selectedKeyFile ? $scope.selectedKeyFile.name : undefined,
     rememberPeriod: $scope.rememberPeriod
   }).then(function() {
     secureCache.clear('entries');
     unlockedState.clearBackgroundState();
     window.close();
   }); 	
  }

  //go to the options page to manage key files
  $scope.manageKeyFiles = function() {
    optionsLink.go();
  }

  $scope.chooseAnotherFile = function() {
    unlockedState.clearBackgroundState();
    secureCache.clear('entries');
    $location.path('/choose-file');
  }

  $scope.enterMasterPassword = function(passwordKey) {
    $scope.clearMessages();
    $scope.busy = true;

    let passwordKeyPromise;
    if (passwordKey === undefined)
      passwordKeyPromise = keepass.getMasterKey($scope.masterPassword, $scope.selectedKeyFile);
    else
      passwordKeyPromise = Promise.resolve(passwordKey);

    passwordKeyPromise.then(function(newPasswordKey) {
      passwordKey = newPasswordKey;
      return keepass.getDecryptedData(passwordKey);
    }).then(function(decryptedData) {
      //remember usage for next time
      let entries = decryptedData.entries;
      let version = decryptedData.version;
      let databaseUsage = {
        requiresPassword: $scope.masterPassword !== "" ? true : false,
        requiresKeyfile: $scope.selectedKeyFile !== undefined ? true : false,
        passwordKey: undefined,
        version: version,
        keyFileName: $scope.selectedKeyFile !== undefined ? $scope.selectedKeyFile.name : undefined,
        rememberPeriod: $scope.rememberPeriod
      }
      if ($scope.rememberPassword === true){
        databaseUsage['passwordKey'] = passwordKey;
      }
      settings.saveCurrentDatabaseUsage(databaseUsage);
      settings.saveDefaultRememberOptions($scope.rememberPassword, $scope.rememberPeriod);

      if ($scope.rememberPeriod > 0) {
        let check_time = 60000*$scope.rememberPeriod; // milliseconds per min
        settings.setForgetTime('forgetPassword', (Date.now() + check_time));
      } else {
        //don't clear passwords
        settings.clearForgetTimes(['forgetPassword']);
      }
      //show results:
      showResults(entries);
      $scope.busy = false;
    }).catch(function(err) {
      $scope.errorMessage = err.message || "Incorrect password or key file";
      $scope.busy = false;
      passwordKey = null;
    }).then(function() {
      $scope.$apply();
    });
  };

  settings.getKeyFiles().then(keyFiles => {
    $scope.keyFiles = keyFiles;
  }).then( () => {
	  return settings.getDefaultRememberOptions();
  }).then( rememberOptions => {
    $scope.setRememberPeriod(rememberOptions.rememberPeriod);
  }).then( () => {
    return settings.getCurrentDatabaseUsage();
  }).then( usage => {
    //tweak UI based on what we know about the database file
    $scope.hidePassword = (usage.requiresPassword === false);
    $scope.hideKeyFile = (usage.requiresKeyfile === false);
    $scope.rememberedPassword = (usage.passwordKey !== undefined);
    $scope.setRememberPeriod(usage.rememberPeriod);

    if (usage.passwordKey !== undefined && usage.requiresKeyfile === false) {
    	//autologin if we know the password and there is no keyfile.
    	$scope.enterMasterPassword(usage.passwordKey);
    } else if (usage.keyFileName !== undefined) {
    	// get matched key file
      let matches = $scope.keyFiles.filter(function(keyFile) {
        return keyFile.name == usage.keyFileName;
      })
      if (matches.length >= 1) {
        $scope.selectedKeyFile = matches[0];
        if ($scope.hidePassword === true || usage.passwordKey !== undefined) {
          // auto-login if we know there is no password OR we know the password already.
        	$scope.enterMasterPassword(usage.passwordKey)
        }
      }
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
      showResults(entries);
      $scope.$apply();
    }
  }).catch(function(err) {
    //this is fine - it just means the cache expired.  Clear the cache to be sure.
    secureCache.clear('entries');
  });

  function showResults(entries) {

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

    //save longer term (in encrypted storage)
    secureCache.save('entries', entries);
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
    return parser;
  }
}
