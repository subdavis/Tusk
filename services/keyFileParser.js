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
 * Parses a KeePass key file
 */
module.exports = function KeyFileParser() {
  var exports = {

  };

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

  exports.getKeyFromFile = function(keyFileBytes) {
    var arr = new Uint8Array(keyFileBytes);
    if (arr.byteLength == 0) {
      return Promise.reject(new Error('key file has zero bytes'));
    } else if (arr.byteLength == 32) {
      //file content is the key
      return Promise.resolve(arr);
    } else if (arr.byteLength == 64) {
      //file content may be a hex string of the key
      var decoder = new TextDecoder();
      var hexString = decoder.decode(arr);
      var newArr = hex2arr(hexString);
      if (newArr.length == 32) {
        return Promise.resolve(newArr);
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
        return Promise.resolve(Base64.decode(keyNode.singleNodeValue.textContent));
      }
    } catch (err) {
      //continue, not valid xml keyfile
    }

    var SHA = {
      name: "SHA-256"
    };

    return window.crypto.subtle.digest(SHA, arr);
  }

  return exports;
}
