
"use strict";

/**
 * Providera for retrieving the encrypted password file into an ArrayBuffer
 */
function GoogleDrivePasswordFileProvider(gdocs) {
  var my = {

  };

  function getFile(url) {
     return gdocs.sendXhr('GET', url).then(function(e) {
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
