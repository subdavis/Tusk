/**

The MIT License (MIT)

Copyright (c) 2015 Steven Campbell.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

 */

"use strict";

function GoogleDrivePasswordFileManager($http) {
  var exports = {
    key: 'gdrive',
    routePath: '/choose-file',
    listDatabases: listDatabases,
    getDatabaseChoiceData: getDatabaseChoiceData,
    getChosenDatabaseFile: getChosenDatabaseFile,
    supportedFeatures: ['listDatabases'],
    title: 'Google Drive',
    icon: 'icon-google',
    chooseTitle: 'Google Drive',
    chooseDescription: 'Access password files stored on your Google Drive.  The file(s) will be fetched from Google Drive each time they are used.',
    interactiveRequestAuth: interactiveRequestAuth,
    revokeAuth: revokeAuth,
    isAuthorized: isAuthorized
  };

  var accessToken;  //cached access token
  function interactiveRequestAuth() {
    return auth(true);
  }

  //revoke the oauth2 token on the oauth2 server
  function revokeAuth() {
    if (accessToken) {
      var url = 'https://accounts.google.com/o/oauth2/revoke?token=' + accessToken
      return $http.get(url).then(function(response) {
        return removeCachedAuthToken();
      });
  	} else {
  	  return Promise.resolve();
  	}
  }

  //remove chrome's cached copy of the oauth2 token
  function removeCachedAuthToken() {
    return new Promise(function(resolve) {
      if (accessToken) {
        var tempAccessToken = accessToken;
        accessToken = null;
        // Remove token from the token cache.
        chrome.identity.removeCachedAuthToken({
          token : tempAccessToken
        }, function() {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  function isAuthorized() {
    return accessToken ? true : false;
  }

  function listDatabases() {
    return getPasswordFiles(true).catch(function(err) {
      return [];
    });
  }

  function getPasswordFiles() {
    var url = "https://www.googleapis.com/drive/v2/files?q=fileExtension='kdbx' or fileExtension='kdb'";
    return sendAuthorizedGoogleDriveGet(url).then(function(data) {
      return data.items.map(function(entry) {
        return {
          title : entry.title,
          url : entry.selfLink
        };
      });
    });
  }

  //get the minimum information needed to identify this file for future retrieval
  function getDatabaseChoiceData(dbInfo) {
    return {
      title: dbInfo.title,
      url: dbInfo.url
    }
  }

  //given minimal file information, retrieve the actual file
  function getChosenDatabaseFile(databaseChoiceData) {
    return sendAuthorizedGoogleDriveGet(databaseChoiceData.url).then(function(details) {
      //the first url just gets us the file details, which we use to download the file
      return sendAuthorizedGoogleDriveGet(details.downloadUrl, 'arraybuffer');
    }).then(function(data) {
      return data;
    });
  }

  //sends an authorized request to google drive, including retry
  //(retry is necessary because local cached token may get out of sync, then we need a new one)
  function sendAuthorizedGoogleDriveGet(url, optionalResponseType, dontRetry) {
    return auth().then(function() {
      var request = {
        method: 'GET',
        url: url,
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      };
      if (optionalResponseType)
        request.responseType = optionalResponseType;

      return $http(request);
    }).then(function(response) {
      return response.data;
    }).catch(function(response) {
      if (response.status == 401 && !dontRetry) {
        return removeCachedAuthToken().then(function() {
          return sendAuthorizedGoogleDriveGet(url, optionalResponseType, true);
        });
      } else {
        throw new Error("Request to retrieve files from drive failed - " + response.statusText)
      }
    });
  }

  //get authorization token
  function auth(interactive) {
    return new Promise(function(resolve, reject) {
  		chrome.identity.getAuthToken({
  			interactive : interactive
  		}, function(token) {
  			accessToken = token;
  			if (token)
  			  resolve();
  			else
  			  var err = chrome.extension.lastError;
  			  if (!err) {
  			    err = new Error("Failed to authenticate.");
  			  }
  			  if (err.message == "OAuth2 not granted or revoked.") {
  			    //too confusing
  			    reject(new Error("ChromeKeePass needs access to Google Drive to access this password file.  You must Authorize google drive access to continue."))
  			  } else {
    			  reject(err);
  			  }
  		});
    });
  }

  return exports;
}
