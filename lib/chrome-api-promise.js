

chrome.p = (function() {
  my = {
    storage: {
      sync: {
        "set": storageSyncSet,
        "get": storageSyncGet
      },
      local: {
        "set": storageLocalSet,
        "get": storageLocalGet
      }
    }
  };

  function storageSet(storageArea, data) {
    return new Promise(function(resolve, reject) {
    	storageArea.set(data, function() {
    	  if (chrome.runtime.lastError) {
    	    reject(new Error(chrome.runtime.lastError.message));
    	  } else {
    		  resolve();
    	  }
  		});
    })
  }

  function storageGet(storageArea, keys) {
    return new Promise(function(resolve, reject) {
      storageArea.get(keys, function(items) {
    	  if (chrome.runtime.lastError) {
    	    reject(new Error(chrome.runtime.lastError.message));
    	  } else {
    		  resolve(items);
    	  }
    	});
    });
  }

  function storageSyncSet(data) {
    return storageSet(chrome.storage.sync, data);
  }
  function storageSyncGet(keys) {
    return storageGet(chrome.storage.sync, keys);
  }
  function storageLocalSet(data) {
    return storageSet(chrome.storage.local, data);
  }
  function storageLocalGet(keys) {
    return storageGet(chrome.storage.local, keys);
  }

  return my;
})();
