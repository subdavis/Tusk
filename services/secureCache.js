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
 * Storage in cache using a key derived from 3rd party-provided secret.
 */
function SecureCache(protectedMemory) {
  var exports = {
    save: set,
    get: get
  }

  var AES = {
    name: "AES-CBC",
    iv: new Uint8Array([0x18, 0x37, 0xC9, 0x4C, 0x1F, 0x42, 0x61, 0x73, 0x92, 0x5A, 0x1D, 0xC3, 0x44, 0x0A, 0x24, 0x40])
  };

  var tokenPromise = new Promise(function(resolve, reject) {
    chrome.identity.getAuthToken({interactive: false}, function(token) {
      if (token) {
        var encoder = new TextEncoder();
        var tokenBytes = encoder.encode(token);
        window.crypto.subtle.digest({name: 'SHA-256'}, tokenBytes).then(function(hash) {
          return window.crypto.subtle.importKey("raw", hash, AES, false, ['encrypt', 'decrypt']);
        }).then(function(aesKey) {
          resolve(aesKey);
        });
      } else {
        reject(new Error('Failed to get a 3rd party secret, cache not possible.'))
      }
    });
  });

  exports.ready = function() {
    return tokenPromise.then(function() {
      return true;
    })
  }

  function set(key, data) {
    var preppedData = protectedMemory.serialize(data);
    return new Promise(function(resolve, reject) {
      tokenPromise.then(function(aesKey) {
        var encoder = new TextEncoder();
        return window.crypto.subtle.encrypt(AES, aesKey, encoder.encode(preppedData));
      }).then(function(encData) {
        preppedData = protectedMemory.serialize(preppedData);
        var obj = {};
        obj[key] = preppedData;
        chrome.storage.local.set(obj, function() {
          //data saved
          resolve();
        });
      }).catch(function(err) {
        reject(err);
      });
    });
  }

  function get(key) {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(key, function(encSerializedData) {
        var encData = protectedMemory.hydrate(encSerializedData[key]);

        tokenPromise.then(function(aesKey) {
          return window.crypto.subtle.decrypt(AES, aesKey, encData).then(function(decryptedBytes) {
            var decoder = new TextDecoder();
            var serialized = decoder.decode(decryptedBytes);
            var data = protectedMemory.hydrate(serialized);

            resolve(data);
          });
        }).catch(function(err) {
          reject(err);
        });
      });
    });
  }

  return exports;
}
