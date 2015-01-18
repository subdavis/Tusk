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