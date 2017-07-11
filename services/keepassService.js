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
function Keepass(keepassHeader, pako, settings, passwordFileStoreRegistry, keepassReference, streamCipher) {
  var my = {

  };

  var littleEndian = (function() {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
  })();

  function getKey(isKdbx, masterPassword, fileKey) {
    if (isKdbx){
      var creds = new kdbxweb.Credentials(kdbxweb.ProtectedValue.fromString(masterPassword), fileKey);
      return creds.ready.then(()=>{
        return kdbxCredentialsToJson(creds);
      });
    } else {
      var partPromises = [];
      var SHA = {
        name: "SHA-256"
      };

      if (masterPassword || !fileKey) {
        var encoder = new TextEncoder();
        var masterKey = encoder.encode(masterPassword);

        var p = window.crypto.subtle.digest(SHA, new Uint8Array(masterKey));
        partPromises.push(p);
      }

      if (fileKey) {
        partPromises.push(Promise.resolve(fileKey));
      }

      return Promise.all(partPromises).then(function(parts) {
        if (partPromises.length > 1) {
          //kdb with fileKey + masterPassword, do the SHA a second time
          var compositeKeySource = new Uint8Array(32 * parts.length);
          for (var i = 0; i < parts.length; i++) {
            compositeKeySource.set(new Uint8Array(parts[i]), i * 32);
          }

          return window.crypto.subtle.digest(SHA, compositeKeySource);
        } else {
          //kdb with just only fileKey or masterPassword (don't do a second SHA digest in this scenario)
          return partPromises[0];
        }
      });
    }
  }

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
      } else { // KDB - fallback to doing it all ourselves.
        majorVersion = 2;
        if (h.innerRandomStreamId != 2 && h.innerRandomStreamId != 0) throw new Error('Invalid Stream Key - Salsa20 is supported by this implementation, Arc4 and others not implemented.');
        var encData = new Uint8Array(buf, h.dataStart);
        //console.log("read file header ok.  encrypted data starts at byte " + h.dataStart);
        var SHA = {
          name: "SHA-256"
        };
        var AES = {
          name: "AES-CBC",
          iv: h.iv
        };

        return aes_ecb_encrypt(h.transformSeed, masterKey, h.keyRounds).then(function(finalVal) {
          //do a final SHA-256 on the transformed key
          return window.crypto.subtle.digest({
            name: "SHA-256"
          }, finalVal);
        }).then(function(encMasterKey) {
          var finalKeySource = new Uint8Array(h.masterSeed.byteLength + 32);
          finalKeySource.set(h.masterSeed);
          finalKeySource.set(new Uint8Array(encMasterKey), h.masterSeed.byteLength);

          return window.crypto.subtle.digest(SHA, finalKeySource);
        }).then(function(finalKeyBeforeImport) {
          return window.crypto.subtle.importKey("raw", finalKeyBeforeImport, AES, false, ["decrypt"]);
        }).then(function(finalKey) {
          return window.crypto.subtle.decrypt(AES, finalKey, encData);
        }).then(function(decryptedData) {
          //at this point we probably have successfully decrypted data, just need to double-check:
          //kdb
          var entries = parseKdb(decryptedData, h);
          return entries;
        }).then(processReferences(entries, majorVersion));
      }
    }).then(function(entries){
      return {
        entries: entries,
        version: majorVersion
      };
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

  //parse kdb file:
  function parseKdb(buf, h) {

    return window.crypto.subtle.digest({
      name: "SHA-256"
    }, h.protectedStreamKey).then(function(streamKey) {
    	streamCipher.setKey(streamKey);

      var pos = 0;
      var dv = new DataView(buf);
      var groups = [];
      for(var i=0; i<h.numberOfGroups; i++) {
        var fieldType = 0, fieldSize = 0;
        var currentGroup = {};
        var preventInfinite = 100;
        while (fieldType != 0xFFFF && preventInfinite > 0) {
          fieldType = dv.getUint16(pos, littleEndian);
          fieldSize = dv.getUint32(pos + 2, littleEndian);
          pos += 6;

          readGroupField(fieldType, fieldSize, buf, pos, currentGroup);
          pos += fieldSize;
          preventInfinite -= 1;
        }

        groups.push(currentGroup);
      }

      var entries = [];
      for(var i=0; i<h.numberOfEntries; i++) {
        var fieldType = 0, fieldSize = 0;
        var currentEntry = {keys: []};
        var preventInfinite = 100;
        while (fieldType != 0xFFFF && preventInfinite > 0) {
          fieldType = dv.getUint16(pos, littleEndian);
          fieldSize = dv.getUint32(pos + 2, littleEndian);
          pos += 6;

          readEntryField(fieldType, fieldSize, buf, pos, currentEntry);
          pos += fieldSize;
          preventInfinite -= 1;
        }

        currentEntry.group = groups.filter(function(grp) {
          return grp.id == currentEntry.groupId;
        })[0];
        currentEntry.groupName = currentEntry.group.name;
        currentEntry.keys.push('groupName');
        currentEntry.groupIconId = currentEntry.group.iconId;

        //in-memory-protect the password in the same way as on KDBX
        if (currentEntry.password) {
        	var position = streamCipher.position;
          var encPassword = streamCipher.encryptString(currentEntry.password);
          currentEntry.protectedData = {
            password: {
              data: encPassword,
              position: position
            }
          };
          currentEntry.password = Base64.encode(encPassword);  //overwrite the unencrypted password
        }

        if (!(currentEntry.title == 'Meta-Info' && currentEntry.userName == 'SYSTEM')
        	&& (currentEntry.groupName != 'Backup')
        	&& (currentEntry.groupName != 'Search Results')) {

          entries.push(currentEntry);
        }
      }

      return entries;
    });
  }


  //read KDB entry field
  function readEntryField(fieldType, fieldSize, buf, pos, entry) {
    var dv = new DataView(buf, pos, fieldSize);
    var arr = [];
    if (fieldSize > 0) {
      arr = new Uint8Array(buf, pos, fieldSize - 1);
    }
    var decoder = new TextDecoder();

    // Expiration not supported.  Mark all entries as unexpired.
    entry.keys.push('expiry');
    entry.expiry = "";
    entry.is_expired = false;

    switch (fieldType) {
      case 0x0000:
        // Ignore field
        break;
      case 0x0001:
        entry.id = convertArrayToUUID(new Uint8Array(buf, pos, fieldSize));
        break;
      case 0x0002:
        entry.groupId = dv.getUint32(0, littleEndian);
        break;
      case 0x0003:
        entry.iconId = dv.getUint32(0, littleEndian);
        break;
      case 0x0004:
        entry.title = decoder.decode(arr);
        entry.keys.push('title');
        break;
      case 0x0005:
        entry.url = decoder.decode(arr);
        entry.keys.push('url');
        break;
      case 0x0006:
        entry.userName = decoder.decode(arr);
        entry.keys.push('userName');
        break;
      case 0x0007:
        entry.password = decoder.decode(arr);
        break;
      case 0x0008:
        entry.notes = decoder.decode(arr);
        entry.keys.push('notes');
        break;
    /*
      case 0x0009:
        ent.tCreation = new PwDate(buf, offset);
        break;
      case 0x000A:
        ent.tLastMod = new PwDate(buf, offset);
        break;
      case 0x000B:
        ent.tLastAccess = new PwDate(buf, offset);
        break;
      case 0x000C:
        ent.tExpire = new PwDate(buf, offset);
        break;
      case 0x000D:
        ent.binaryDesc = Types.readCString(buf, offset);
        break;
      case 0x000E:
        ent.setBinaryData(buf, offset, fieldSize);
        break;
    */
    }
  }

  //read KDB group field
  function readGroupField(fieldType, fieldSize, buf, pos, group) {
    var dv = new DataView(buf, pos, fieldSize);
    var arr = [];
		if (fieldSize > 0) {
      arr = new Uint8Array(buf, pos, fieldSize - 1);
    }
    
    switch (fieldType) {
      case 0x0000:
        // Ignore field
        break;
      case 0x0001:
        group.id = dv.getUint32(0, littleEndian);
        break;
      case 0x0002:
        var decoder = new TextDecoder();
        group.name = decoder.decode(arr);
        break;
      case 0x0007:
        group.iconId = dv.getUint32(0, littleEndian);
        break;
      /*
      case 0x0009:
      	group.flags = dv.getUint32(0, littleEndian);
      	break; 
      */
      /*
      case 0x0003:
        group.tCreation = new PwDate(buf, offset);
        break;
      case 0x0004:
        group.tLastMod = new PwDate(buf, offset);
        break;
      case 0x0005:
        group.tLastAccess = new PwDate(buf, offset);
        break;
      case 0x0006:
        group.tExpire = new PwDate(buf, offset);
        break;
      case 0x0007:
        group.icon = db.iconFactory.getIcon(LEDataInputStream.readInt(buf, offset));
        break;
      case 0x0008:
        group.level = LEDataInputStream.readUShort(buf, offset);
        break;
      case 0x0009:
        group.flags = LEDataInputStream.readInt(buf, offset);
        break;
      */
    }
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

  function aes_ecb_encrypt(rawKey, data, rounds) {
    var data = new Uint8Array(data);
    //Simulate ECB encryption by using IV of the data.
    var blockCount = data.byteLength / 16;
    var blockPromises = new Array(blockCount);
    for (var i = 0; i < blockCount; i++) {
      var block = data.subarray(i * 16, i * 16 + 16);
      blockPromises[i] = (function(iv) {
        return aes_cbc_rounds(iv, rawKey, rounds);
      })(block);
    }
    return Promise.all(blockPromises).then(function(blocks) {
      //we now have the blocks, so chain them back together
      var result = new Uint8Array(data.byteLength);
      for (var i = 0; i < blockCount; i++) {
        result.set(blocks[i], i * 16);
      }
      return result;
    });
  }

  /*
	* Performs rounds of CBC encryption on data using rawKey
  */
  function aes_cbc_rounds(data, rawKey, rounds) {
  	if (rounds == 0) {
  		//just pass back the current value
  		return data;
  	} else if (rounds > 0xFFFF) {
  		//limit memory use to avoid chrome crash:
  		return aes_cbc_rounds_single(data, rawKey, 0xFFFF).then(function(result) {
  			return aes_cbc_rounds(result, rawKey, rounds - 0xFFFF);
  		});
  	} else {
  		//last iteration, or only iteration if original rounds was low:
  		return aes_cbc_rounds_single(data, rawKey, rounds);
  	}
  }

  function aes_cbc_rounds_single(data, rawKey, rounds) {
    var AES = {
      name: "AES-CBC",
      iv: data
    };
    return window.crypto.subtle.importKey("raw", rawKey, AES, false, ["encrypt"]).then(function(secureKey) {
      var fakeData = new Uint8Array(rounds * 16);
      return window.crypto.subtle.encrypt(AES, secureKey, fakeData);
    }).then(function(result) {
      return new Uint8Array(result, (rounds - 1) * 16, 16);
    });
  }

  function convertArrayToUUID(arr) {
  	var int8Arr = new Uint8Array(arr);
  	var result = new Array(int8Arr.byteLength * 2);
  	for (var i=0;i<int8Arr.byteLength;i++) {
  		result[i * 2] = int8Arr[i].toString(16).toUpperCase();
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
