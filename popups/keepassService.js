
"use strict";

function Keepass(gdocs) {
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
    var done = false;
    var position = 12;  //after initial db signature + version
    var h = {};
    /*
    public static final byte EndOfHeader = 0;
		public static final byte Comment = 1;
        public static final byte CipherID = 2;
        public static final byte CompressionFlags = 3;
        public static final byte MasterSeed = 4;
        public static final byte TransformSeed = 5;
        public static final byte TransformRounds = 6;
        public static final byte EncryptionIV = 7;
        public static final byte ProtectedStreamKey = 8;
        public static final byte StreamStartBytes = 9;
        public static final byte InnerRandomStreamID = 10;
    */
    while (!done) {
      var descriptor = new DataView(buf, position, 3);
      var fieldId = descriptor.getUint8(0, internals.littleEndian);
      var len = descriptor.getUint8(1, internals.littleEndian);

      console.log("field id: " + fieldId + ", len: " + len);
      var dv = new DataView(buf, position + 2, len);
      position += 2;
      switch (fieldId) {
        case 0: //end of header
          done = true;
          break;
        case 2: //cipherid, 16 bytes
          h.cipher = buf.slice(position, len);
          break;
        case 3: //compression flags, 4 bytes
          h.compressionFlags = dv.getUint32(0, internals.littleEndian);
          break;
        case 4: //master seed
          h.masterSeed = buf.slice(position, len);
          break;
        case 5: //transform seed
          h.transformSeed = buf.slice(position, len);
          break;
        case 6: //transform rounds, 8 bytes
          h.transformRounds1 = dv.getUint32(0, internals.littleEndian);
          h.transformRounds2 = dv.getUint32(4, internals.littleEndian);
          break;
        case 7: //iv
          h.iv = buf.slice(position, len);
          break;
        case 8: //protected stream key
          h.protectedStreamKey = buf.slice(position, len);
          break;
        case 9:
          h.streamStartBytes = buf.slice(position, len);
          break;
        case 10:
          h.innerRandomStreamId = buf.slice(position, len);
          break;
        default:
          break;
      }

      if (!done) {
        position += len + 1;  //extra zero-byte between each field?
      }
    }

    console.log(h);
    return h;
  }

  my.getPassword = function(siteKey, callback) {
    getPasswordFile(function(buf, length) {
      var DBSIG_1 = 0x9AA2D903;
      var DBSIG_2 = 0xB54BFB67;
      var FILE_VERSION_CRITICAL_MASK = 0xFFFF0000;
      var FILE_VERSION_32 = 0x00030001;

      var h4 = readHeader(buf);
      return;

      var header = new DataView(buf, 0, 124);
      var h = {
        sig1 : header.getUint32(0, internals.littleEndian),
        sig2 : header.getUint32(4, internals.littleEndian),
        flags : header.getUint32(8, internals.littleEndian),
        version : header.getUint32(12, internals.littleEndian),
        masterSeed : buf.slice(16, 16),
        iv : buf.slice(32, 16),
        groupsLen : header.getUint32(48, internals.littleEndian),
        entriesLen : header.getUint32(52, internals.littleEndian),
        contentsHash : buf.slice(56, 32),
        masterSeedExtra : buf.slice(88, 32),
        keyRounds : header.getUint32(120, internals.littleEndian)
      };

      console.log("flags: " + h.flags.toString(16));
      console.log("groups: " + h.groupsLen.toString(16) + ", entries: " + h.entriesLen.toString(16));
      console.log("version: " + h.version.toString(16) + ", keyRounds: " + h.keyRounds.toString(16));

      if (h.sig1 != DBSIG_1 || h.sig2 != DBSIG_2) {
        //fail
        console.log("Signature fail.  sig 1:" + h.sig1.toString(16) + ", sig2:" + h.sig2.toString(16) + ", flags:" + h.flags.toString(16));
        return;
      }

      var encData = new DataView(buf, 124, length-124)
      var SHAdigest = {
        name: "SHA-256"
      };
      var AES = {
        name: "AES-CBC",
        iv: h.iv
      };

      var encoder = new TextEncoder();
      var pwBytes = encoder.encode(internals.masterPassword);
      window.crypto.subtle.digest(SHAdigest, pwBytes)
        .then(function(result) {
          //result is the hash as ArrayBuffer //console.log(result);
          var pwHash = result;

        });
    });
  }

  return my;
}

