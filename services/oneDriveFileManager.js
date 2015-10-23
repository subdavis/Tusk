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

function OneDriveFileManager ($http, $q, settings) {
  var accessTokenType = 'onedrive';

  var exports = {
    key: 'onedrive',
    routePath: '/onedrive',
    listDatabases: listDatabases,
    //getDatabaseChoiceData: getDatabaseChoiceData,
    //getChosenDatabaseFile: getChosenDatabaseFile,
    supportedFeatures: ['listDatabases'],
    title: 'OneDrive',
    icon: 'icon-onedrive',
    chooseTitle: 'OneDrive',
    chooseDescription: 'Access password files stored on OneDrive.  Files will be retrieved from OneDrive each time they are used.',
    authorize: authorize,
    revokeAuth: revokeAuth,
    isAuthorized: isAuthorized
  };

  function isAuthorized () {
    return settings.getAccessToken(accessTokenType).then(function (token) {
      return token != null;
    });
  }

  function authorize () {
    var promise = $q.defer();

    var url = 'https://login.live.com/oauth20_authorize.srf' +
              '?client_id=0000000044169A58' +
              '&scope=' + encodeURIComponent('onedrive.readonly') +
              '&response_type=token' +
              '&redirect_uri=' + encodeURIComponent(chrome.identity.getRedirectURL('onedrive'));

    var promise = chrome.p.identity.launchWebAuthFlow({url: url, interactive: true}).then(function (redirectUrl) {
      var authInfo = parseAuthInfoFromUrl(redirectUrl);
      if (authInfo === null) {
        return Promise.reject('Failed to extract authentication information from redirect url');
      }

      settings.saveAccessToken(accessTokenType, authInfo.access_token);
      return Promise.resolve();
    });
    return $q.when(promise);
  }

  function listDatabases () {
    var promise = settings.getAccessToken(accessTokenType)
      .then(searchFiles)
      .then(filterFiles)
      .catch(function (response) {
        // token expired
        if (response.status && response.status == 401) {
          return authorize().then(listDatabases);
        }
      });

    return $q.when(promise);
  }

  function searchFiles (token) {
    if (!token) {
      return Promise.reject('No access token available. Did you authorize yet?');
    }

    // there is no proper way of searching for file-extensions right now (?), so we search for files containing kdb and filter ourselves afterwards
    var query = encodeURIComponent('kdb');
    var filter = encodeURIComponent('file ne null');
    var url = 'https://api.onedrive.com/v1.0/drive/root/view.search?q=' + query + '&filter=' + filter;
    return $http({ method: 'GET', url: url, headers: { Authorization: 'Bearer ' + token }});
  }

  function filterFiles (response) {
    if (!response.data.value) {
      return Promise.reject('Unexpected response from OneDrive API');
    }

    // only return files that have a .kdb or .kdbx extension
    return response.data.value.filter(function (file) {
      return file.name && /\.kdbx?$/.exec(file.name);
    });
  }

  function parseAuthInfoFromUrl (url) {
    var hash = /#(.+)$/.exec(url);
    if (!hash) {
      return null;
    }

    hash = hash[1];
    return JSON.parse('{"' + hash.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function(key, value) {
      return key === "" ? value : decodeURIComponent(value);
    });
  }

  function revokeAuth () {
    settings.saveAccessToken(accessTokenType, null);
  }

  return exports;
}
