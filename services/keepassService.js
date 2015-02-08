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

function Keepass(keepassHeader, pako, localStorage) {
  var my = {

  };

  var littleEndian = (function() {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
  })();

  function hex2arr(hex) {
    try {
      var arr = [];
      for (var i = 0; i < hex.length; i += 2)
        arr.push(parseInt(hex.substr(i, 2), 16));
      return arr;
    } catch (err) {
      return [];
    }
  }

  my.getKeyFromFile = function(keyFileBytes) {
    var arr = new Uint8Array(keyFileBytes);
    if (arr.byteLength == 0) {
      throw new Error('key file has zero bytes');
    } else if (arr.byteLength == 32) {
      //file content is the key
      return arr;
    } else if (arr.byteLength == 64) {
      //file content may be a hex string of the key
      var decoder = new TextDecoder();
      var hexString = decoder.decode(arr);
      var newArr = hex2arr(hexString);
      if (newArr.length == 32) {
        return newArr;
      }
    }

    //attempt to parse xml
    try {
      var decoder = new TextDecoder();
      var xml = decoder.decode(arr);
      var parser = new DOMParser();
      var doc = parser.parseFromString(xml, "text/xml");
      var keyNode = doc.evaluate('//KeyFile/Key/Data', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (keyNode.singleNodeValue && keyNode.singleNodeValue.textContent) {
        return Base64.decode(keyNode.singleNodeValue.textContent);
      }
    } catch (err) {
      //continue, not valid xml keyfile
    }

    var SHA = {
      name: "SHA-256"
    };

    return window.crypto.subtle.digest(SHA, arr);
  }

  function getKey(h, masterPassword, fileKey) {
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
      if (h.kdbx || partPromises.length > 1) {
        //kdbx, or kdb with fileKey + masterPassword, do the SHA a second time
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

  my.getPasswords = function(masterPassword, fileKey) {
    return localStorage.getSavedDatabaseChoice().then(function(fileStore) {
      if (chrome.extension.inIncognitoContext && !fileStore.supportsIngognito) {
        throw new Error('Unable to access this password file in ingognito mode due to Chrome security restrictions.');
      }
      return fileStore.getFile();
    }).then(function(buf) {
      var h = keepassHeader.readHeader(buf);
      if (!h) throw new Error('Failed to read file header');
      if (h.innerRandomStreamId != 2 && h.innerRandomStreamId != 0) throw new Error('Invalid Stream Key - Salsa20 is supported by this implementation, Arc4 and others not implemented.')

      var encData = new Uint8Array(buf, h.dataStart);
      //console.log("read file header ok.  encrypted data starts at byte " + h.dataStart);
      var SHA = {
        name: "SHA-256"
      };
      var AES = {
        name: "AES-CBC",
        iv: h.iv
      };

      var compositeKeyPromise = getKey(h, masterPassword, fileKey);

      return compositeKeyPromise.then(function(masterKey) {
        //transform master key thousands of times
        return aes_ecb_encrypt(h.transformSeed, masterKey, h.keyRounds);
      }).then(function(finalVal) {
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
        var block = null;
        if (h.kdbx) {
          //kdbx
          var storedStartBytes = new Uint8Array(decryptedData, 0, 32);
          for (var i = 0; i < 32; i++) {
            if (storedStartBytes[i] != h.streamStartBytes[i]) {
              throw new Error('Decryption succeeded but payload corrupt');
              return;
            }
          }

          //ok, data decrypted, lets start parsing:
          var blockHeader = new DataView(decryptedData, 32, 40);
          var blockId = blockHeader.getUint32(0, littleEndian);
          var blockSize = blockHeader.getUint32(36, littleEndian);
          var blockHash = new Uint8Array(decryptedData, 36, 32);

          block = new Uint8Array(decryptedData, 72, blockSize);

          if (h.compressionFlags == 1) {
            block = pako.inflate(block);
          }
        } else {
          //kdb
          block = decryptedData;
        }


        if (h.kdbx) {
          //xml
          var decoder = new TextDecoder();
          var xml = decoder.decode(block);

          var entries = parseXml(xml, h.protectedStreamKey);
          return entries;
        } else {
          //custom format
          var entries = parseKdb(block, h);
          return entries;
        }
      });
    });
  }

  //parse kdb file:
  function parseKdb(buf, h) {
    return window.crypto.subtle.digest({
      name: "SHA-256"
    }, h.protectedStreamKey).then(function(streamKey) {
      my.streamKey = streamKey;
      var iv = [0xE8, 0x30, 0x09, 0x4B, 0x97, 0x20, 0x5D, 0x2A];
      var salsa = new Salsa20(new Uint8Array(my.streamKey), iv);
      var salsaPosition = 0;

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
        var currentEntry = {};
        var preventInfinite = 100;
        while (fieldType != 0xFFFF && preventInfinite > 0) {
          fieldType = dv.getUint16(pos, littleEndian);
          fieldSize = dv.getUint32(pos + 2, littleEndian);
          pos += 6;

          readEntryField(fieldType, fieldSize, buf, pos, currentEntry);
          pos += fieldSize;
          preventInfinite -= 1;
        }

        //if (Case.constant(currentEntry.title) != "META_INFO") {
        //meta-info items are not actual password entries
        currentEntry.group = groups.filter(function(grp) {
          return grp.id == currentEntry.groupId;
        })[0];
        currentEntry.groupName = currentEntry.group.name;

        //in-memory-protect the password in the same way as on KDBX
        if (currentEntry.password) {
          var encoder = new TextEncoder();
          var passwordBytes = encoder.encode(currentEntry.password);
          var encPassword = salsa.encrypt(new Uint8Array(passwordBytes));
          currentEntry.protectedData = {
            password: {
              data: encPassword,
              position: salsaPosition
            }
          };
          currentEntry.password = Base64.encode(encPassword);  //not used - just for consistency with KDBX

          salsaPosition += passwordBytes.byteLength;
        }

        entries.push(currentEntry);
        //}
      }

      return entries;
    });
  }

  //read KDB entry field
  function readEntryField(fieldType, fieldSize, buf, pos, entry) {
    var dv = new DataView(buf, pos, fieldSize);
    var arr = new Uint8Array(buf, pos, fieldSize);
    var decoder = new TextDecoder();

    switch (fieldType) {
      case 0x0000:
        // Ignore field
        break;
      case 0x0001:
        entry.id = arr;
        break;
      case 0x0002:
        entry.groupId = dv.getUint32(0, littleEndian);
        break;
      case 0x0003:
        entry.iconId = dv.getUint32(0, littleEndian);
        break;
      case 0x0004:
        entry.title = decoder.decode(arr);
        break;
      case 0x0005:
        entry.url = decoder.decode(arr);
        break;
      case 0x0006:
        entry.userName = decoder.decode(arr);
        break;
      case 0x0007:
        entry.password = decoder.decode(arr);
        break;
      case 0x0008:
        entry.notes = decoder.decode(arr);
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
    var arr = new Uint8Array(buf, pos, fieldSize);
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

  /**
   * Returns the decrypted data from a protected element of a KDBX entry
   */
  function getDecryptedEntry(protectedData, streamKey) {
    var iv = [0xE8, 0x30, 0x09, 0x4B, 0x97, 0x20, 0x5D, 0x2A];
    var salsa = new Salsa20(new Uint8Array(streamKey || my.streamKey), iv);
    var decoder = new TextDecoder();

    salsa.getBytes(protectedData.position);
    var decryptedBytes = new Uint8Array(salsa.decrypt(protectedData.data));
    return decoder.decode(decryptedBytes);
  }
  my.getDecryptedEntry = getDecryptedEntry; //expose the function

  /**
   * Parses the KDBX entries xml into an object format
   **/
  function parseXml(xml, protectedStreamKey) {
    return window.crypto.subtle.digest({
      name: "SHA-256"
    }, protectedStreamKey).then(function(streamKey) {
      my.streamKey = streamKey;
      var decoder = new TextDecoder();
      var parser = new DOMParser();
      var doc = parser.parseFromString(xml, "text/xml");
      //console.log(doc);

      /*

            var protectedNodes = doc.evaluate("//Value[@Protected='True']", doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            for (var i=0 ; i < protectedNodes.snapshotLength; i++) {
              var protectedNode = protectedNodes.snapshotItem(i);
              var val = protectedNode.textContent;
              var encBytes = StringView.base64ToBytes(val);
              var base64val = StringView.bytesToBase64(salsa.decrypt(encBytes));
              var finalVal = atob(base64val);
            }
      */

      var results = [];
      var entryNodes = doc.evaluate('//Entry', doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var protectedPosition = 0;
      for (var i = 0; i < entryNodes.snapshotLength; i++) {
        var entryNode = entryNodes.snapshotItem(i);
        //console.log(entryNode);
        var entry = {
          protectedData: {}
        };

        //exclude histories and recycle bin:
        if (entryNode.parentNode.nodeName != "History") {
          for (var m = 0; m < entryNode.parentNode.children.length; m++) {
            var groupNode = entryNode.parentNode.children[m];
            if (groupNode.nodeName == 'Name')
              entry.groupName = groupNode.textContent;
          }

          if (entry.groupName != "Recycle Bin")
            results.push(entry);
        }
        for (var j = 0; j < entryNode.children.length; j++) {
          var childNode = entryNode.children[j];

          if (childNode.nodeName == "String") {
            var key = childNode.getElementsByTagName('Key')[0].textContent;
            key = Case.camel(key);
            var valNode = childNode.getElementsByTagName('Value')[0];
            var val = valNode.textContent;
            var protectedVal = valNode.hasAttribute('Protected');

            if (protectedVal) {
              var encBytes = StringView.base64ToBytes(val);
              entry.protectedData[key] = {
                position: protectedPosition,
                data: encBytes
              };

              protectedPosition += encBytes.length;
              //val = atob(StringView.bytesToBase64(salsa.decrypt(encBytes)));
            }
            entry[key] = val;
          }
        }
      }

      //console.log(results);
      return results;
    });
  }

  function aes_ecb_encrypt(rawKey, data, rounds) {
    var data = new Uint8Array(data);
    //Simulate ECB encryption by using IV of the data.
    var blockCount = data.byteLength / 16;
    var blockPromises = new Array(blockCount);
    for (var i = 0; i < blockCount; i++) {
      var block = data.subarray(i * 16, i * 16 + 16);
      blockPromises[i] = (function(iv) {
        var AES = {
          name: "AES-CBC",
          iv: iv
        };
        return window.crypto.subtle.importKey("raw", rawKey, AES, false, ["encrypt"]).then(function(secureKey) {
          var fakeData = new Uint8Array(rounds * 16);
          return window.crypto.subtle.encrypt(AES, secureKey, fakeData);
        }).then(function(result) {
          return new Uint8Array(result, (rounds - 1) * 16, 16);
        });
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

  return my;
}
