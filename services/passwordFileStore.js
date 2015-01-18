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
 *
 * Instance methods:
 *  - getFile() - retrieves the file
 */


function PasswordFileStoreFactory(gdocs) {
  var my = {

  };

  function getInstance(key, fi) {
    switch(key) {
      case "gdrive":
        return new GoogleDrivePasswordFileProvider(gdocs, fi);
      case "local":
        return new LocalChromePasswordFileProvider(fi);
      default:
        return new LocalChromePasswordFileProvider(fi);
    }
  }
  my.getInstance = getInstance;  //expose

  return my;
}

/**
 * Provider for retrieving the encrypted password file from Google Drive
 */
function GoogleDrivePasswordFileProvider(gdocs, fileHandle) {
  var my = {
    title: fileHandle.title
  };

  function getFile() {
    return gdocs.sendXhr('GET', fileHandle.url).then(function(e) {
      //this gets the file details, which we need to download the file
      var details = JSON.parse(e.currentTarget.responseText);
      var url = details.downloadUrl;
      return gdocs.sendXhr('GET', url, 'arraybuffer').then(function(e) {
        return e.currentTarget.response;
      });
    });
  }
  my.getFile = getFile;  //expose

  return my;
}

/**
 * Provider for retrieving the encrypted password file from local chrome storage
 */
function LocalChromePasswordFileProvider(fi) {
  var my = {
    title: fi.title
  };

  function getFile() {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get('passwordFiles', function(result) {
        var success = false;
    		if (result && result.passwordFiles) {
          result.passwordFiles.forEach(function(storedFile) {
            if (storedFile.title == fi.title) {
              var bytes = StringView.base64ToBytes(storedFile.data);
              resolve(bytes.buffer);
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
  my.getFile = getFile;  //expose

  return my;
}
