"use strict";

function LocalStorage(passwordFileStoreFactory) {
  var my = {

  };

  var passwordFileStoreFactory = passwordFileStoreFactory;

  function savePasswordChoice(providerKey, fileInfo) {
    return new Promise(function(resolve, reject) {
      fileInfo = angular.copy(fileInfo);
      fileInfo.data = undefined;  //don't save the data with the choice
    	chrome.storage.sync.set({'passwordFile': fileInfo, 'providerKey': providerKey}, function() {
    	  if (chrome.runtime.lastError) {
    	    reject(new Error(chrome.runtime.lastError.message));
    	  } else {
    	    var fileStore = passwordFileStoreFactory.getInstance(providerKey, fileInfo);
    		  resolve(fileStore);
    	  }
  		});
    })
  }
  my.savePasswordChoice = savePasswordChoice;

  /**
   * Returns the saved password choice as a "fileStore", which exposes getFile() and title properties.
   */
  function getSavedPasswordChoice() {
    return new Promise(function(resolve, reject) {
      chrome.storage.sync.get(['passwordFile', 'providerKey'], function(items) {
    		if (items.passwordFile && items.providerKey) {
    		  var fileStore = passwordFileStoreFactory.getInstance(items.providerKey, items.passwordFile);
    		  resolve(fileStore);
    		} else {
    		  reject(new Error('Could not find a saved password file choice'));
    		}
    	});
    });
  }
  my.getSavedPasswordChoice = getSavedPasswordChoice;

  return my;
}