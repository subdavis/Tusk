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

  }

  exports.saveDatabaseUsages = function(usages) {
    //TODO: refactor usages so they can be retrived and saved inbdividually
    return chrome.p.storage.local.set({
      'databaseUsage': usages
    });
  }

  exports.getDatabaseUsages = function() {
    return chrome.p.storage.local.get(['databaseUsages']).then(function(items) {
      items.databaseUsages = items.databaseUsages || {};
      return items.databaseUsages;
    });
  }

  exports.saveCurrentDatabaseChoice = function(passwordFile, providerKey) {
    passwordFile = angular.copy(passwordFile);
    passwordFile.data = undefined; //don't save the data with the choice

    return chrome.p.storage.local.set({
      'passwordFile': passwordFile,
      'providerKey': providerKey
    });
  }

  exports.getCurrentDatabaseChoice = function() {
    return chrome.p.storage.local.get(['passwordFile', 'providerKey']).then(function(items) {
      return {
        passwordFile: items.passwordFile,
        providerKey: items.providerKey
      };
    });
  }

  return exports;
}
