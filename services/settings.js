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
 * Settings for ChromeKeePass
 */
function Settings() {
  var exports = {}

  //upgrade old settings.  Called on install.
  exports.upgrade = function() {
    //move key files out of usages into key file section
    exports.getDatabaseUsages().then(function(usages) {
      for(var usageKey in usages) {
        var usage = usages[usageKey];
        if (usage.keyFileName && usage.fileKeyBase64) {
          exports.addKeyFile(usage.keyFileName, Base64.decode(usage.fileKeyBase64));
        }
        usage.fileKeyBase64 = undefined;
        usage.forgetKeyFile = undefined;
      }

      exports.saveDatabaseUsages(usages);
    });

    //change the way we store currently selected database
    chrome.p.storage.local.get(['passwordFile', 'providerKey']).then(function(items) {
      if (items.passwordFile && items.providerKey) {
        chrome.p.storage.local.set({
          'selectedDatabase': {
            'providerKey': items.providerKey,
            'passwordFile': items.passwordFile
          }
        })
      }
    });
  }

  exports.getKeyFiles = function() {
    return chrome.p.storage.local.get(['keyFiles']).then(function(items) {
      return items.keyFiles || [];
    });
  }

  exports.deleteKeyFile = function(name) {
    return exports.getKeyFiles().then(function(keyFiles) {
      keyFiles.forEach(function(keyFile, index) {
        if (keyFile.name == name) {
          keyFiles.splice(index, 1);
        }
      })

      return chrome.p.storage.local.set({'keyFiles': keyFiles});
    });
  }

  exports.addKeyFile = function(name, key) {
    return exports.getKeyFiles().then(function(keyFiles) {
      var matches = keyFiles.filter(function(keyFile) {
        return keyFile.name == name;
      })

      var encodedKey = Base64.encode(key);
      if (matches.length) {
        //update
        matches[0].encodedKey = encodedKey;
      } else {
        //insert
        keyFiles.push({
          name: name,
          encodedKey: encodedKey
        })
      }

      return chrome.p.storage.local.set({'keyFiles': keyFiles});
    });
  }

  exports.setDiskCacheFlag = function(val) {
    return chrome.p.storage.local.set({
      'useDiskCache': val
    });
  }

  exports.getDiskCacheFlag = function() {
    return chrome.p.storage.local.get('useDiskCache').then(function(items) {
      return items.useDiskCache;
    });
  }

  exports.saveDatabaseUsages = function(usages) {
    //TODO: refactor usages so they can be retrived and saved individually
    return chrome.p.storage.local.set({
      'databaseUsages': usages
    });
  }

  exports.getDatabaseUsages = function() {
    return chrome.p.storage.local.get(['databaseUsages']).then(function(items) {
      items.databaseUsages = items.databaseUsages || {};
      return items.databaseUsages;
    });
  }

  exports.saveCurrentDatabaseChoice = function(passwordFile, provider) {
    passwordFile = angular.copy(passwordFile);
    passwordFile.data = undefined; //don't save the data with the choice

    return chrome.p.storage.local.set({
      'selectedDatabase': {
        'passwordFile': passwordFile,
        'providerKey': provider.key
      }
    });
  }

  exports.getCurrentDatabaseChoice = function() {
    return chrome.p.storage.local.get(['selectedDatabase']).then(function(items) {
      if (items.selectedDatabase) {
        return items.selectedDatabase;
      } else {
        return null;
      }
    });
  }

  return exports;
}
