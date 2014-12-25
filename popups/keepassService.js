
"use strict";

function Keepass(gdocs) {
  var my = {
    passwordSet: false,
    fileSet: false
  };

  var internals = {
    masterPassword: "",
    url: ""
  }

  my.setMasterPassword = function(pwd) {
    internals.masterPassword = pwd;
    my.passwordSet = true;
  }

  my.setFile = function(url) {
    internals.url = url;
    my.fileSet = true;
  }

  my.getPassword = function(siteKey) {
    //gdocs.sendXhr('GET', items.passwordFileName, processKeyFile, 'arraybuffer');
  }

  return my;
}

