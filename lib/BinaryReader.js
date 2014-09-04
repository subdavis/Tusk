/*
 The MIT License (MIT)

 Copyright (c) 2014 emspishak

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 Copied from https://github.com/emspishak/keepass-chrome
 */

function BinaryReader(arraybuffer, opt_length) {
	this.data_ = new Uint8Array(arraybuffer);
	this.length_ = opt_length || arraybuffer.byteLength;
	this.pos_ = 0;
}

BinaryReader.fromWordArray = function(wordArray) {
	var length = Math.ceil(wordArray.sigBytes / Uint32Array.BYTES_PER_ELEMENT) * Uint32Array.BYTES_PER_ELEMENT;
	var buf = new ArrayBuffer(length);
	var words = new Uint32Array(buf);
	// swap endianness, from http://stackoverflow.com/questions/5320439/#answer-5320624
	words.set(wordArray.words.map(function(val) {
		return ((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF);
	}));
	return new BinaryReader(buf, wordArray.sigBytes);
};

BinaryReader.prototype.hasNextByte = function() {
	return this.pos_ < this.length_;
};

BinaryReader.prototype.hasNextInt = function() {
	return this.pos_ < this.length_ - 3;
};

BinaryReader.prototype.readByte = function() {
	if (!this.hasNextByte()) {
		throw new RangeError();
	}
	return this.data_[this.pos_++];
};

BinaryReader.prototype.readBytes = function(num) {
	var bytes = [];
	for (var i = 0; i < num; i++) {
		bytes.push(this.readByte());
	}
	return bytes;
};

BinaryReader.prototype.readNumber_ = function(bytes) {
	var bytes = this.readBytes(bytes);
	var result = 0;
	for (var i = bytes.length - 1; i >= 0; i--) {
		result = (result * 256) + bytes[i];
	}
	return result;
};

BinaryReader.prototype.readShort = function() {
	return this.readNumber_(2);
};

BinaryReader.prototype.readInt = function() {
	return this.readNumber_(4);
};

BinaryReader.prototype.readWord = function() {
	var bytes = this.readBytes(4);
	var result = 0;
	for (var i = 0; i < bytes.length; i++) {
		result = (result * 256) + bytes[i];
	}
	return result;
};

BinaryReader.prototype.readWordArray = function(num) {
	var words = [];
	while (num > 0) {
		words.push(this.readWord());
		num -= 4;
	}
	return CryptoJS.lib.WordArray.create(words);
};

BinaryReader.prototype.readRestToWordArray = function() {
	var restOfFile = [];
	var numBytes = 0;
	while (this.hasNextInt()) {
		restOfFile.push(this.readWord());
		numBytes += 4;
	}
	return CryptoJS.lib.WordArray.create(restOfFile, numBytes);
};

// Reads in a null-terminated string.
BinaryReader.prototype.readString = function() {
	var result = '';
	var b = this.readByte();
	while (b != 0) {
		result += String.fromCharCode(b);
		b = this.readByte();
	}
	return result;
};

BinaryReader.prototype.readDate = function() {
	var bytes = this.readBytes(5);

	var year = (bytes[0] << 6) | (bytes[1] >> 2);
	var month = ((bytes[1] & 3) << 2) | (bytes[2] >> 6);
	var day = (bytes[2] >> 1) & 31;
	var hour = ((bytes[2] & 1) << 4) | (bytes[3] >> 4);
	var min = ((bytes[3] & 15) << 2) | (bytes[4] >> 6);
	var sec = bytes[4] & 63;

	return new Date(year, month - 1, day, hour, min, sec);
}; 