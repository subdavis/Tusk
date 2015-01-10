
"use strict";

function Keepass(gdocs, pako) {
  var my = {
    passwordSet: false,
    fileSet: false
  };

  var internals = {
    masterPassword: "",
    url: ""
  }

/*
  uint32_t flags;
	uint32_t version;
	uint8_t  master_seed[16]; //FinalKey = SHA-256(aMasterSeed, TransformedUserMasterKey)
	uint8_t  encryption_init_vector[16]; //  Init vector for AES/Twofish
	uint32_t groups_len;
	uint32_t entries_len;
	uint8_t  contents_hash[32]; //  Hash of decrypted data
	uint8_t  master_seed_extra[32]; //  Used for extra AES transformations
	uint32_t key_rounds;

	4, 4, 16, 16, 4, 4, 32, 32, 4
*/

  internals.littleEndian = (function() {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
  })();

  my.setMasterPassword = function(pwd) {
    internals.masterPassword = pwd;
    my.passwordSet = true;
  }

  my.setFile = function(url) {
    internals.url = url;
    my.fileSet = true;
  }

  function getPasswordFile(callback) {
    gdocs.sendXhr('GET', internals.url, function(e) {
      //this gets the file details
      var details = JSON.parse(this.responseText);
      var url = details.downloadUrl;
      gdocs.sendXhr('GET', url, function(e) {
        callback(this.response, e.total);
      }, 'arraybuffer');
    });
  }

  function readHeader(buf) {
    var position = 12;  //after initial db signature + version
    var sigHeader = new DataView(buf, 0, position)
    var h = {
      sig1 : sigHeader.getUint32(0, internals.littleEndian),
      sig2 : sigHeader.getUint32(4, internals.littleEndian),
      version : sigHeader.getUint32(8, internals.littleEndian)
    };

    var DBSIG_1 = 0x9AA2D903;
    var DBSIG_2 = 0xB54BFB67;
    var FILE_VERSION = 0x00030001;
    if (h.sig1 != DBSIG_1 || h.sig2 != DBSIG_2) {
      //fail
      console.log("Signature fail.  sig 1:" + h.sig1.toString(16) + ", sig2:" + h.sig2.toString(16) + ", version:" + h.version.toString(16));
      return;
    }

    /*
        AES_CIPHER_UUID = 0x31c1f2e6bf714350be5805216afc5aff;
    */
    var done = false;
    while (!done) {
      var descriptor = new DataView(buf, position, 3);
      var fieldId = descriptor.getUint8(0, internals.littleEndian);
      var len = descriptor.getUint16(1, internals.littleEndian);

      var dv = new DataView(buf, position + 3, len);
      //console.log("fieldid " + fieldId + " found at " + position);
      position += 3;
      switch (fieldId) {
        case 0: //end of header
          done = true;
          break;
        case 2: //cipherid, 16 bytes
          h.cipher = new Uint8Array(buf, position, len);
          break;
        case 3: //compression flags, 4 bytes
          h.compressionFlags = dv.getUint32(0, internals.littleEndian);
          break;
        case 4: //master seed
          h.masterSeed = new Uint8Array(buf, position, len);
          break;
        case 5: //transform seed
          h.transformSeed = new Uint8Array(buf, position, len);
          break;
        case 6: //transform rounds, 8 bytes
          h.keyRounds = dv.getUint32(0, internals.littleEndian);
          h.keyRounds2 = dv.getUint32(4, internals.littleEndian);
          break;
        case 7: //iv
          h.iv = new Uint8Array(buf, position, len);
          break;
        case 8: //protected stream key
          h.protectedStreamKey = new Uint8Array(buf, position, len);
          break;
        case 9:
          h.streamStartBytes = new Uint8Array(buf, position, len);
          break;
        case 10:
          h.innerRandomStreamId = new Uint8Array(buf, position, len);
          break;
        default:
          break;
      }

      position += len;
    }

    h.dataStart = position;
    //console.log(h);
    //console.log("version: " + h.version.toString(16) + ", keyRounds: " + h.keyRounds);
    return h;
  }

  my.getPassword = function() {
    return new Promise(function(resolve, reject) {
      getPasswordFile(function(buf, length) {
        var h = readHeader(buf);
        if (!h) return;

        var encData = new Uint8Array(buf, h.dataStart);
        //console.log("read file header ok.  encrypted data starts at byte " + h.dataStart);
        var SHA = {
          name: "SHA-256"
        };
        var AES = {
          name: "AES-CBC",
          iv: h.iv
        };

        //console.log('password is ' + internals.masterPassword);
        var encoder = new TextEncoder();
        var masterKey = encoder.encode(internals.masterPassword);

        //console.log(masterKey);
        window.crypto.subtle.digest(SHA, masterKey).then(function(masterKey) {
          return window.crypto.subtle.digest(SHA, masterKey);
        }).then(function(masterKey) {
            //console.log(new Uint8Array(masterKey));
            encryptMasterKey(h.transformSeed, masterKey, h.keyRounds).then(function(encMasterKey) {
              var finalKeySource = new Uint8Array(64);
              finalKeySource.set(h.masterSeed);
              finalKeySource.set(new Uint8Array(encMasterKey), 32);
              //console.log(finalKeySource);
              window.crypto.subtle.digest(SHA, finalKeySource).then(function(finalKeyBeforeImport) {
                window.crypto.subtle.importKey("raw", finalKeyBeforeImport, AES, false, ["decrypt"]).then(function(finalKey) {
                  window.crypto.subtle.decrypt(AES, finalKey, encData).then(function(decryptedData) {
                    var storedStartBytes = new Uint8Array(decryptedData, 0, 32);
                    for (var i=0; i<32; i++) {
                      if (storedStartBytes[i] != h.streamStartBytes[i]) {
                        reject('Incorrect password');
                        return;
                      }
                    }
                    //console.log("decrypt of data succeeded");
                    var blockHeader = new DataView(decryptedData, 32, 40);
                    var blockId = blockHeader.getUint32(0, internals.littleEndian);
                    var blockSize = blockHeader.getUint32(36, internals.littleEndian);
                    console.log(blockId, blockSize, decryptedData.byteLength);
                    var blockHash = new Uint8Array(decryptedData, 36, 32);
                    var block = new Uint8Array(decryptedData, 72, blockSize);
                    if (h.compressionFlags == 1) {
                      block = pako.inflate(block);
                      //console.log("unzip of data succeeded");
                    }

                    var decoder = new TextDecoder();
                    var xml = decoder.decode(block);

                    var entries = parseXml(xml);
                    //console.log(entries);
                    resolve(entries);
                  }).catch(function(err) {
                    reject("decrypt of data failed");
                    //console.log(err);
                  });
                }).catch(function(err) {
                  reject("import of final-key failed: " + err.message);
                });
              }).catch(function(err) {
                reject("digest of final-key-source failed: " + err.message);
              });
            }).catch(function(err) {
              reject("encryptmasterkey failed: " + err.message);
            });
          }).catch(function(err) {
            reject("digest of masterkey failed: " + err.message);
          });
        });
      });
    });
  }

  /**
   * Parses the entries xml into an object format
   **/
  function parseXml(xml) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xml, "text/xml");
    console.log(doc);

    var results = [];
    var entryNodes = doc.evaluate('//Entry', doc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i=0 ; i < entryNodes.snapshotLength; i++) {
      var entryNode = entryNodes.snapshotItem(i);
      //console.log(entryNode);
      var entry = {};
      results.push(entry);
      for (var j=0; j < entryNode.children.length; j++) {
        var childNode = entryNode.children[j];

        if (childNode.nodeName == "String") {
          var key = childNode.getElementsByTagName('Key')[0].textContent;
          var valNode = childNode.getElementsByTagName('Value')[0];
          var val = valNode.textContent;
          var protectedVal = valNode.hasAttribute('Protected');

          entry[key] = {
            value: val
          };
          if (protectedVal)
            entry[key].encrypted = true;
        }
      }
    }

    return results;
  }

  /**
   * encrypts the master key the specified times and hashes the result
   **/
  function encryptMasterKey(rawTransformKey, rawMasterKey, rounds) {
    var arr = new Array(rounds - 1);
    for(var i=0; i<rounds - 1; i++)
      arr[i] = i;  //reduce ignores holes in the array, so we have to specify each

    return arr.reduce(function(prev, curr) {
      return prev.then(function(newKey) {
        return aes_ecb_encyrpt(rawTransformKey, newKey);
      });
    }, aes_ecb_encyrpt(rawTransformKey, rawMasterKey)).then(function(finalVal) {
      //do a final SHA-256 on the result
      return window.crypto.subtle.digest({name: "SHA-256"}, finalVal);
    });
  }

  /**
   * Simulate ECB encryption by breaking the data into 16byte blocks and
   * calling CBC on each block individually.
   **/
  function aes_ecb_encyrpt(raw_key, data) {
    return new Promise(function(resolve, reject) {
      data = new Uint8Array(data);
      var blockCount = data.byteLength / 16;

      var blockPromises = new Array(blockCount);
      for (var i = 0; i<blockCount; i++) {
        var block = data.subarray(i * 16, i * 16 + 16);
        blockPromises[i] = aes_ecb_encrypt_block(raw_key, block);
      }

      Promise.all(blockPromises).then(function(blocks) {
        //we now have the blocks, so chain them back together
        var result = new Uint8Array(data.byteLength);
        for (var i=0; i<blockCount; i++) {
          result.set(blocks[i], i * 16);
        }

        resolve(result);
      }).catch(function(err) {
        reject(err);
      });
    });
  }

  /**
   * Simulate ECB encryption by using IV of 0 and only one block.  AES block size is
   * 16 bytes = 128 bits.  Data size must be 16 bytes, i.e. 1 blocks
   **/
  function aes_ecb_encrypt_block(raw_key, data16) {
    return new Promise(function(resolve, reject) {
      var AES = {
        name: "AES-CBC",
          iv: new Uint8Array(16)
      };  //iv is intentionally 0, to simulate the ECB

      window.crypto.subtle.importKey("raw", raw_key, AES, false, ["encrypt"]).then(function(secureKey) {
        window.crypto.subtle.encrypt(AES, secureKey, data16).then(function(encBlockWithPadding) {
          //trim the padding
          var encBlock = new Uint8Array(encBlockWithPadding, 0, 16);
          resolve(encBlock);
        }).catch(function(err) {
          reject(err);
        })
      }).catch(function(err) {
        reject(err);
      });
    });
  }

  return my;
}

