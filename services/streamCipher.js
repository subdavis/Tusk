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

/*
 * Encapsulates decoding and encoding of protected data using the Salsa20 stream cipher.
 */
function StreamCipher() {
	"use strict";

	var my = {
		setKey: setKey,
		getKey: getKey,
		encryptString: encryptString,
		getDecryptedFieldValue: getDecryptedFieldValue,
		clear: clear,
		position: 0
	};

	var salsa, plainKey;

	/*
	 * Init the cipher with the given 32 byte key (Array or UInt8Array or ArrayBuffer)
	 */
	function setKey(key) {
		plainKey = key;
		var streamKey = new Uint8Array(key);
    var iv = [0xE8, 0x30, 0x09, 0x4B, 0x97, 0x20, 0x5D, 0x2A];
    salsa = new Salsa20(streamKey, iv);
    my.position = 0;
	}

	function getKey() {
		return plainKey;
	}

	function encryptString(plainText) {
 		var encoder = new TextEncoder();
    var bytes = encoder.encode(plainText);
    var encBytes = salsa.encrypt(new Uint8Array(bytes));

    my.position += encBytes.length;  //advance the stream position

    return encBytes;
	}

	function clear() {
		salsa = null;
		my.position = 0;
		plainKey = null;
	}

	/*
	 * Return the unencrypted data for this field
	 */
  function getDecryptedFieldValue(currentEntry, fieldName) {
  	if (currentEntry.protectedData === undefined || !currentEntry.protectedData[fieldName])
  		return currentEntry[fieldName] || "";  //not an encrypted field

 		var decoder = new TextDecoder();
  	var protectedData = currentEntry.protectedData[fieldName];
  	salsa.reset();
    salsa.getBytes(protectedData.position);
    var decryptedBytes = new Uint8Array(salsa.decrypt(protectedData.data));
    var result = decoder.decode(decryptedBytes);

    return result;
  }

	return my;
}
