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

function LocalStorage(settings) {
  var my = {
    saveCurrentDatabaseUsage: saveCurrentDatabaseUsage,
    getCurrentDatabaseUsage: getCurrentDatabaseUsage
  };

  /**
   * Saves information about how the database was opened, so we can optimize the
   * UI next time by hiding the irrelevant options and remembering the keyfile
   */
  function saveCurrentDatabaseUsage(usage) {
    return settings.getCurrentDatabaseChoice().then(function(info) {
      return settings.getDatabaseUsages().then(function(usages) {
        var key = info.title + "__" + info.providerKey;
        usages[key] = usage;

        return settings.saveDatabaseUsages(usages);
      });
    });
  }

  /**
   * Retrieves information about how the database was opened, so we can optimize the
   * UI by hiding the irrelevant options and remembering the keyfile
   */
  function getCurrentDatabaseUsage() {
    return settings.getCurrentDatabaseChoice().then(function(info) {
      return settings.getDatabaseUsages().then(function(usages) {
        var key = info.title + "__" + info.providerKey;
        var usage = usages[key] || {};

        return usage;
      });
    })
  }

  return my;
}
