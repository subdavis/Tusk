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

/**
 * This file has a factory plus the instances that it can create.
 *
 * Angular DI only does constructor injection resulting in singletons, and we need to
 * be able to switch, i.e. singletons won't work.  So, a plain ol' vanilla factory method.
 *
 * The factory returns an instance based on a key.
 *
 * Each instance is responsible for retrieving a password-file from its particular storage.
 *
 * Instance parameters:
 *  - fi, fileHandle = file info.  provider-specific, i.e. no guarantees on what properties it has
 *
 * Instance properties:
 *  - title = title of the file
 *  - providerKey = unique key of the provider
 *  - supportsIngognito = works in ingognito mode
 *
 * Instance methods:
 *  - getFile() - retrieves the file
 */


function PasswordFileStoreFactory(gdocs) {
  var exports = {
    getInstance: getInstance,
    listProviders: listProviders
  };

  function getInstance(key, fi) {
    switch (key) {
      case "gdrive":
        return new GoogleDrivePasswordFileFetcher(gdocs, fi);
      case "local":
        return new LocalChromePasswordFileFetcher(fi);
      default:
        return new LocalChromePasswordFileFetcher(fi);
    }
  }

  function listProviders(requiredFeature) {
    var all = [new GoogleDrivePasswordFileManager(gdocs), new LocalChromePasswordFileManager()];

    if (!requiredFeature) return all;

    return all.filter(function(provider) {
      return provider.supportedFeatures.indexOf(requiredFeature) > -1;
    });
  }

  return exports;
}

function GoogleDrivePasswordFileManager(gdocs) {
  var exports = {
    key: 'gdrive',
    listDatabases: listDatabases,
    supportedFeatures: ['listDatabases'],
    title: 'Google Drive',
    icon: 'icon-google',
    chooseTitle: 'Google Drive',
    chooseDescription: 'Access password files stored on your Google Drive.  The file(s) will be fetched from Google Drive each time they are used.'
  };

  function listDatabases() {
    return gdocs.auth().then(function() {
      return gdocs.getPasswordFiles(true);
    }).catch(function(err) {
      return [];
    });
  }

  return exports;
}

/**
 * Provider for retrieving the encrypted password file from Google Drive
 */
function GoogleDrivePasswordFileFetcher(gdocs, fileHandle) {
  var exports = {
    providerKey: "gdrive",
    title: fileHandle.title,
    supportsIngognito: false
  };

  function getFile() {
    return gdocs.auth().then(function() {
      return gdocs.sendXhr('GET', fileHandle.url);
    }).then(function(e) {
      //this gets the file details, which we need to download the file
      var details = JSON.parse(e.currentTarget.responseText);
      var url = details.downloadUrl;
      return gdocs.sendXhr('GET', url, 'arraybuffer');
    }).then(function(e) {
      return e.currentTarget.response;
    });
  }
  exports.getFile = getFile; //expose

  return exports;
}

function LocalChromePasswordFileManager() {
  var exports = {
    key: 'local',
    listDatabases: listDatabases,
    supportedFeatures: ['listDatabases', 'addDatabase'],
    supportsIngognito: true,
    title: 'Chrome Storage',
    icon: 'icon-upload',
    chooseTitle: 'File System',
    chooseDescription: 'Upload files from your local or remote file-system.  A one-time copy of the file(s) will be saved in Chrome local storage.  If you update the database on your local system then you will have to re-upload it in order to see the changes.'
  };

  function listDatabases() {
    return chrome.p.storage.local.get('passwordFiles').then(function(result) {
      return result.passwordFiles || [];
    });
  }

  return exports;
}

/**
 * Provider for retrieving the encrypted password file from local chrome storage
 */
function LocalChromePasswordFileFetcher(fi) {
  var exports = {
    providerKey: "local",
    title: fi.title,
    supportsIngognito: false
  };

  function getFile() {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get('passwordFiles', function(result) {
        var success = false;
        if (result && result.passwordFiles) {
          result.passwordFiles.forEach(function(storedFile) {
            if (storedFile.title == fi.title) {
              var bytes = Base64.decode(storedFile.data);
              resolve(bytes);
              success = true;
            }
          });
        }

        if (!success) {
          reject(new Error("Failed to find the requested file"));
        }
      });
    });
  }
  exports.getFile = getFile; //expose

  return exports;
}
