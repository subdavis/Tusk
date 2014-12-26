
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
        //console.log("loaded: " + e.loaded + ", total: " + e.total);
        //var req = this;
        //console.log(req.status);
        //console.log(req.readyState);

        callback(this.response);
      }, 'arraybuffer');

    });
  }

  my.getPassword = function(siteKey, callback) {
    getPasswordFile(function(buf) {
      var DBSIG_1 = 0x9AA2D903;
      var DBSIG_2 = 0xB54BFB67;
      var FILE_VERSION_CRITICAL_MASK = 0xFFFF0000;
      var FILE_VERSION_32 = 0x00030001;

      var header = new DataView(buf, 0, 124);
      var sig1 = header.getUint32(0, internals.littleEndian);
      var sig2 = header.getUint32(4, internals.littleEndian);
      var flags = header.getUint32(8, internals.littleEndian);

      if (sig1 != DBSIG_1 || sig2 != DBSIG_2) {
        //fail
        console.log("Signature fail.  sig 1:" + sig1.toString(16) + ", sig2:" + sig2.toString(16) + ", flags:" + flags.toString(16));
        return;
      }


    });
  }

  return my;
}

