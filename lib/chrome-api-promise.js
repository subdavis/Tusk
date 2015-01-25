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

chrome.p = (function() {
  my = {
    permissions: {
      "contains": permissionContains,
      "request": permissionRequest,
      "remove": permissionRemove
    },
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

  function permissionRemove(perms) {
    return new Promise(function(resolve, reject) {
      chrome.permissions.remove(perms, function(removed) {
        if (removed) {
          // The permissions have been removed.
          resolve();
        } else {
          // The permissions have not been removed (e.g., you tried to remove
          // required permissions).
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            reject(new Error("Failed to remove permission"));
          }
        }
      });
    });
  }

  function permissionContains(perms) {
    return new Promise(function(resolve, reject) {
      chrome.permissions.contains(perms, function(hasPermission) {
        if (hasPermission) {
          resolve();
        } else {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            reject(new Error("Failed to evaluate permissions"));
          }
        }
      });
    });
  }

  function permissionRequest(perms) {
    return new Promise(function(resolve, reject) {
      chrome.permissions.request(perms, function(granted) {
        if (granted) {
          resolve();
        } else {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            reject(new Error("Failed to grant permission"));
          }
        }
      });
    });
  }

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
