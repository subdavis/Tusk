
"use strict";

/**
 * Provider for retrieving the encrypted password file from Google Drive
 */
function GoogleDrivePasswordFileProvider(gdocs) {
  var my = {

  };

  function getFile(fileHandle) {
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
function LocalChromePasswordFileProvider() {
  var my = {

  };

  function getFile(fi) {

    return new Promise(function(resolve, reject) {
      chrome.storage.local.get('passwordFiles', function(result) {
        var success = false;
    		if (result && result.passwordFiles) {
          result.passwordFiles.forEach(function(storedFile) {
            if (storedFile.name == fi.name) {
              resolve(StringView.base64ToBytes(storedFile.data))
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
