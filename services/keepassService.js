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
 * Service for opening keepass files
 */
function Keepass(keepassHeader, pako, settings, passwordFileStoreRegistry, keepassReference) {
  var my = {};

  var littleEndian = (function() {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
  })();

  my.getMasterKey = function(masterPassword, keyFileInfo) {
    var fileKey = keyFileInfo ? Base64.decode(keyFileInfo.encodedKey) : null;
    return passwordFileStoreRegistry.getChosenDatabaseFile(settings).then(function(buf) {
      var h = keepassHeader.readHeader(buf);
  		return getKey(h.kdbx, masterPassword, fileKey);
  	});
  }

  my.getDecryptedData = function(masterKey) {
    var majorVersion;    
    return passwordFileStoreRegistry.getChosenDatabaseFile(settings).then(function(buf) {
      var h = keepassHeader.readHeader(buf);
      if (!h) throw new Error('Failed to read file header');

      if (h.kdbx){ // KDBX - use kdbxweb library
        kdbxweb.CryptoEngine.argon2 = argon2;
        var kdbxCreds = jsonCredentialsToKdbx(masterKey);
        return kdbxweb.Kdbx.load(buf, kdbxCreds).then(db => {
          var psk = new Uint8Array(db.header.protectedStreamKey, 0, db.header.protectedStreamKey.length);
          var entries = parseKdbxDb(db.groups);
          majorVersion = db.header.versionMajor;
          return processReferences(entries, majorVersion);
        });
      } else { // KDB - we don't support this anymore
        throw "Unsupported Database Version";
      }
    }).then(function(entries){
      return {
        entries: entries,
        version: majorVersion
      };
    });
  }

  function getKey(isKdbx, masterPassword, fileKey) {
    var creds = new kdbxweb.Credentials(kdbxweb.ProtectedValue.fromString(masterPassword), fileKey);
    return creds.ready.then(()=>{
      return kdbxCredentialsToJson(creds);
    });
  }

  function processReferences(entries, majorVersion){
    // In order to fully implement references, majorVersion will need to be known
    // as there are more capabilities for references in v2+
    entries.forEach(function(entry) {
      if (entry.keys) {
        entry.keys.forEach(function(key) {
          var fieldRefs = keepassReference.hasReferences(entry[key]);
          if (fieldRefs) {
            entry[key] = keepassReference.processAllReferences(majorVersion, entry[key], entry, entries)
          }
        });
      }
    });
    return entries;
  } 

  /*
   * Takes a kdbxweb group object and transforms it into a list of entries.
   **/
  function parseKdbxDb(groups){
    var results = [];
    for (var i = 0; i < groups.length; i++){
      var group = groups[i]
      if (group.groups.length > 0){
        // recursive case for subgroups.
        results = results.concat(parseKdbxDb(group.groups));
      }
      for (var j = 0; j < group.entries.length; j++){
        var db_entry = group.entries[j];
        var entry = {
          protectedData: {},
          keys: []
        };
        // Entry properties defined by the parent group
        entry.searchable = true;
        if (group.enableSearching == 'false') //verify
          entry.searchable = false;
        entry.groupIconId = group.icon;
        entry.keys.push("groupName");
        entry.groupName = group.name;
        if (entry.searchable)
          results.push(entry);
        // Entry properties defined by the entry
        if (db_entry.uuid){
          if (db_entry.uuid.empty == false)
            entry.id = convertArrayToUUID(Base64.decode(db_entry.uuid.id)); 
        }
        if (db_entry.icon)
          entry.iconId = db_entry.icon;
        if (db_entry.tags.length > 0){ //verify
          var tagstring = ""
          for (let k = 0; k < db_entry.tags.length; k++){
            tagstring += db_entry.tags[k] + ","
          }
          entry.tags = tagstring;
          entry.keys.push('tags');
        }
        if (db_entry.fields){
          var field_keys = Object.keys(db_entry.fields);
          for (let k = 0; k < field_keys.length; k++){
            var field = field_keys[k];
            if (typeof db_entry.fields[field] == "object"){
              // type = object ? protected value
              entry.protectedData[Case.camel(field)] = protectedValueToJSON(db_entry.fields[field]);
            } else {
              entry.keys.push(Case.camel(field));
              entry[Case.camel(field)] = db_entry.fields[field];
            }
          }
        }
      }
    }
    return results;
  }

  function convertArrayToUUID(arr) {
  	var int8Arr = new Uint8Array(arr);
  	var result = new Array(int8Arr.byteLength * 2);
  	for (var i=0;i<int8Arr.byteLength;i++) {
      var hexit = int8Arr[i].toString(16).toUpperCase();
  		result[i * 2] = hexit.length == 2 ? hexit : "0"+hexit;
  	}
  	return result.join("");
  }

  /*
   * The following 3 methods are utilities for the KeeWeb protectedValue class.
   * Because it uses uint8 arrays that are not JSON serializable, we must transform them
   * in and out of JSON serializable formats for use.
   */

  function protectedValueToJSON(pv){
    return {
      salt: Array.from(pv._salt),
      value: Array.from(pv._value)
    }
  }

  function kdbxCredentialsToJson(creds) {
    var jsonRet = {passwordHash:null, keyFileHash:null};
    for (var key in jsonRet)
      if (creds[key])
        jsonRet[key] = protectedValueToJSON(creds[key]);
    return jsonRet;
  }

  function jsonCredentialsToKdbx(jsonCreds){
    var creds = new kdbxweb.Credentials(null, null);
    for (var key in jsonCreds)
      if (jsonCreds[key])
        creds[key] = new kdbxweb.ProtectedValue(jsonCreds[key].value, jsonCreds[key].salt);
    return creds;
  }

  return my;
}
