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
  var my = {

  };

  function getInstance(key, fi) {
    switch (key) {
      case "gdrive":
        return new GoogleDrivePasswordFileProvider(gdocs, fi);
      case "local":
        return new LocalChromePasswordFileProvider(fi);
      default:
        return new LocalChromePasswordFileProvider(fi);
    }
  }
  my.getInstance = getInstance; //expose

  return my;
}

/**
 * Provider for retrieving the encrypted password file from Google Drive
 */
function GoogleDrivePasswordFileProvider(gdocs, fileHandle) {
  var my = {
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
    });;
  }
  my.getFile = getFile; //expose

  return my;
}

/**
 * Provider for retrieving the encrypted password file from local chrome storage
 */
function LocalChromePasswordFileProvider(fi) {
  var my = {
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
  my.getFile = getFile; //expose

  return my;
}
