"use strict";
import pako from 'pako/dist/pako.min.js'

function KeepassHeader() {

	var my = {
		readHeader: readHeader
	};

	var AES_CIPHER_UUID = new Uint8Array([0x31, 0xc1, 0xf2, 0xe6, 0xbf, 0x71, 0x43, 0x50, 0xbe, 0x58, 0x05, 0x21, 0x6a, 0xfc, 0x5a, 0xff]);
	var littleEndian = (function () {
		var buffer = new ArrayBuffer(2);
		new DataView(buffer).setInt16(0, 256, true);
		return new Int16Array(buffer)[0] === 256;
	})();

	function readHeader(buf) {
		var sigHeader = new DataView(buf, 0, 8)
		var h = {
			sigKeePass: sigHeader.getUint32(0, littleEndian),
			sigKeePassType: sigHeader.getUint32(4, littleEndian)
		};

		var DBSIG_KEEPASS = 0x9AA2D903;
		var DBSIG_KDBX = 0xB54BFB67,
			DBSIG_KDBX_ALPHA = 0xB54BFB66,
			DBSIG_KDB = 0xB54BFB55,
			DBSIG_KDB_NEW = 0xB54BFB65;
		var VERSION_KDBX = 3;
		if (h.sigKeePass != DBSIG_KEEPASS || (h.sigKeePassType != DBSIG_KDBX && h.sigKeePassType != DBSIG_KDBX_ALPHA && h.sigKeePassType != DBSIG_KDB && h.sigKeePassType != DBSIG_KDB_NEW)) {
			//fail
			console.log("Signature fail.  sig 1:" + h.sigKeePass.toString(16) + ", sig2:" + h.sigKeePassType.toString(16));
			throw new Error('This is not a valid KeePass file - file signature is not correct.')
		}

		if (h.sigKeePassType == DBSIG_KDBX || h.sigKeePassType == DBSIG_KDBX_ALPHA) {
			h.kdbx = true;
		} else {
			readKdbHeader(buf, 8, h);
		}

		//console.log(h);
		//console.log("version: " + h.version.toString(16) + ", keyRounds: " + h.keyRounds);
		return h;
	}

	function readKdbHeader(buf, position, h) {
		var FLAG_SHA2 = 1;
		var FLAG_RIJNDAEL = 2;
		var FLAG_ARCFOUR = 4;
		var FLAG_TWOFISH = 8;

		var dv = new DataView(buf, position, 116);
		var flags = dv.getUint32(0, littleEndian);
		if (flags & FLAG_RIJNDAEL != FLAG_RIJNDAEL) {
			throw new Error('We only support AES (aka Rijndael) encryption on KeePass KDB files.  This file is using something else.');
		}

		try {
			h.cipher = AES_CIPHER_UUID;
			h.majorVersion = dv.getUint16(4, littleEndian);
			h.minorVersion = dv.getUint16(6, littleEndian);
			h.masterSeed = new Uint8Array(buf, position + 8, 16);
			h.iv = new Uint8Array(buf, position + 24, 16);
			h.numberOfGroups = dv.getUint32(40, littleEndian);
			h.numberOfEntries = dv.getUint32(44, littleEndian);
			h.contentsHash = new Uint8Array(buf, position + 48, 32);
			h.transformSeed = new Uint8Array(buf, position + 80, 32);
			h.keyRounds = dv.getUint32(112, littleEndian);

			//constants for KDB:
			h.keyRounds2 = 0;
			h.compressionFlags = 0;
			h.protectedStreamKey = window.crypto.getRandomValues(new Uint8Array(16)); //KDB does not have this, but we will create in order to protect the passwords
			h.innerRandomStreamId = 0;
			h.streamStartBytes = null;
			h.kdb = true;

			h.dataStart = position + 116; //=124 - the size of the KDB header
		} catch (err) {
			throw new Error('Failed to parse KDB file header - file is corrupt or format not supported');
		}
	}

	function readKdbxHeader(buf, position, h) {
		try {
			var version = new DataView(buf, position, 4)
			h.majorVersion = version.getUint16(0, littleEndian);
			h.minorVersion = version.getUint16(2, littleEndian);
			position += 4;

			var done = false;
			while (!done) {
				var descriptor = new DataView(buf, position, 3);
				var fieldId = descriptor.getUint8(0, littleEndian);
				var len = descriptor.getUint16(1, littleEndian);

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
						h.compressionFlags = dv.getUint32(0, littleEndian);
						break;
					case 4: //master seed
						h.masterSeed = new Uint8Array(buf, position, len);
						break;
					case 5: //transform seed
						h.transformSeed = new Uint8Array(buf, position, len);
						break;
					case 6: //transform rounds, 8 bytes
						h.keyRounds = dv.getUint32(0, littleEndian);
						h.keyRounds2 = dv.getUint32(4, littleEndian);
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
						h.innerRandomStreamId = dv.getUint32(0, littleEndian);
						break;
					default:
						break;
				}

				position += len;
			}

			h.kdbx = true;
			h.dataStart = position;
		} catch (err) {
			throw new Error('Failed to parse KDBX file header - file is corrupt or format not supported');
		}
	}

	return my;
}

export {
	KeepassHeader
}