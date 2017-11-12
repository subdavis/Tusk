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

/*
 * Provides a container for various storage mechanisms (aka FileManagers)that can be injected,
 * so that the rest of the code can be independent of specifics.
**/
module.exports = function PasswordFileStoreRegistry() {
  var exports = {
    listFileManagers: listFileManagers,
    getChosenDatabaseFile: getChosenDatabaseFile
  };

  //each argument is a filemanager.  To add a file manager, add it to the factory
  //for PasswordFileStoreRegistry
  var fileManagers = [];
  for (var i=0; i<arguments.length; i++) {
    fileManagers.push(arguments[i]);
  }

  function listFileManagers(requiredFeature) {
    if (!requiredFeature) return fileManagers;

    return fileManagers.filter(function(fileManager) {
      return fileManager.supportedFeatures.indexOf(requiredFeature) > -1;
    });
  }

  function getChosenDatabaseFile(settings) {
    return settings.getCurrentDatabaseChoice().then(function(choice) {
      var matches = fileManagers.filter(function(fileManager) {
        return fileManager.key == choice.providerKey;
      });

      if (matches.length !== 1) throw new Error('Unable to find file manager for key ' + choice.providerKey);

      return matches[0].getChosenDatabaseFile(choice.passwordFile);
    });
  }

  return exports;
}
