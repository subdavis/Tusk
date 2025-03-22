'use strict';

/**
 * Parses a KeePass key file.  Formats. KeePass supports the following key file formats:
 *
 * XML (recommended, default). There is an XML format for key files. KeePass 2.x uses this format by default, i.e. when creating a key file in the master key dialog, an XML key file is created. The syntax and the semantics of the XML format allow to detect certain corruptions (especially such caused by faulty hardware or transfer problems), and a hash (in XML key files version 2.0 or higher) allows to verify the integrity of the key. This format is resistant to most encoding and new-line character changes (which is useful for instance when the user is opening and saving the key file or when transferring it from/to a server). Such a key file can be printed (as a backup on paper), and comments can be added in the file (with the usual XML syntax: <!-- ... -->). It is the most flexible format; new features can be added easily in the future.
 * 32 bytes. If the key file contains exactly 32 bytes, these are used as a 256-bit cryptographic key. This format requires the least disk space.
 * Hexadecimal. If the key file contains exactly 64 hexadecimal characters (0-9 and A-F, in UTF-8/ASCII encoding, one line, no spaces), these are decoded to a 256-bit cryptographic key.
 * Hashed. If a key file does not match any of the formats above, its content is hashed using a cryptographic hash function in order to build a key (typically a 256-bit key with SHA-256). This allows to use arbitrary files as key files.
 */

function KeyFileParser() {
  var exports = {};

  function hex2arr(hex) {
    try {
      var arr = [];
      for (var i = 0; i < hex.length; i += 2) arr.push(parseInt(hex.substr(i, 2), 16));
      return arr;
    } catch (err) {
      return [];
    }
  }

  exports.getKeyFromFile = function (keyFileBytes) {
    var arr = new Uint8Array(keyFileBytes);
    if (arr.byteLength == 0) {
      return Promise.reject(new Error('The key file cannot be empty'));
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
      var doc = parser.parseFromString(xml, 'text/xml');
      var keyNode = doc.evaluate(
        '//KeyFile/Key/Data',
        doc,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      if (keyNode.singleNodeValue && keyNode.singleNodeValue.textContent) {
        console.log('Key file found in XML');
        return Promise.resolve(keyFileBytes);
      }
    } catch (err) {
      //continue, not valid xml keyfile
    }

    var SHA = {
      name: 'SHA-256',
    };

    return crypto.subtle.digest(SHA, arr);
  };

  return exports;
}

export { KeyFileParser };
