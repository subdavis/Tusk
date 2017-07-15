/**

The MIT License (MIT)

Copyright (c) 2017 Brandon Davis.

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

function LocalChromePasswordFileManager() {
  var exports = {
    key: 'local',
    routePath: '/drag-drop-file',
    listDatabases: listDatabases,
    getDatabaseChoiceData: getDatabaseChoiceData,
    getChosenDatabaseFile: getChosenDatabaseFile,
    saveDatabase: saveDatabase,
    deleteDatabase: deleteDatabase,
    supportedFeatures: ['ingognito', 'listDatabases', 'saveDatabase', 'deleteDatabase'],
    title: 'Chrome Storage',
    icon: 'icon-upload',
    chooseTitle: 'File System',
    chooseDescription: 'Upload files from your local or remote file-system.  A one-time copy of the file(s) will be saved in Chrome local storage.  If you update the database on your local system then you will have to re-upload it in order to see the changes.'
  };

  var backwardCompatibleVersion = 1; //missing version or version less than this is ignored due missing info or bugs in old storage
  var currentVersion = 1; //current version

  var savingLocks = [];  //prevent reading while an async save is ongoing
  function listDatabases() {
    return Promise.all(savingLocks).then(function() {
      return chrome.p.storage.local.get('passwordFiles')
    }).then(function(result) {
      var files = result.passwordFiles || [];

      return files.filter(function(fi) {
        return (fi.storageVersion && fi.storageVersion >= backwardCompatibleVersion);
      });
    });
  }

  //get the minimum information needed to identify this file for future retrieval
  function getDatabaseChoiceData(dbInfo) {
    return {
      title: dbInfo.title
    }
  }

  //given minimal file information, retrieve the actual file
  function getChosenDatabaseFile(dbInfo) {
    return listDatabases().then(function(databases) {
      var bytes = databases.reduce(function(prev, storedFile) {
        if (storedFile.title == dbInfo.title) {
          var data = Base64.decode(storedFile.data);
          return data;
        } else
          return prev;
      }, []);

      if (bytes && bytes.byteLength)
        return bytes;
      else
        throw new Error("Failed to find the requested file");
    });
  }

  //save the given database to persistent storage
  function saveDatabase(db) {
    db.storageVersion = currentVersion;
    var p = listDatabases().then(function(existingFiles) {
      var index = existingFiles.reduce(function(prev, curr, index) {
        if (curr.title == db.title)
          return index;
        else
          return prev;
      }, -1);

      if (index == -1) {
        existingFiles.push(db);
      } else {
        existingFiles[index] = db;
      }

      return chrome.p.storage.local.set({'passwordFiles': existingFiles});
    });

    savingLocks.push(p);  //ensure that a future read has to wait for the write to complete
    return p;
  }

  //remove the database from storage
  function deleteDatabase(db) {
    return listDatabases().then(function(databases) {
      databases = databases.filter(function(existing) {
        return (existing.title != db.title);
      });

      if (databases.length)
        return chrome.p.storage.local.set({'passwordFiles': databases});
      else
        return chrome.p.storage.local.remove('passwordFiles');
    });
  }

  return exports;
}
