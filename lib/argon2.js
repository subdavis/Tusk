'use strict';
import A2Module from '$lib/argon2.wasm.js';

function argon2(password, salt, memory, iterations, length, parallelism, type, version) {
	var Module = A2Module;
	var passwordLen = password.byteLength;
	password = Module.allocate(new Uint8Array(password), 'i8', Module.ALLOC_NORMAL);
	var saltLen = salt.byteLength;
	salt = Module.allocate(new Uint8Array(salt), 'i8', Module.ALLOC_NORMAL);
	var hash = Module.allocate(new Array(length), 'i8', Module.ALLOC_NORMAL);
	var encodedLen = 512;
	var encoded = Module.allocate(new Array(encodedLen), 'i8', Module.ALLOC_NORMAL);
	// jshint camelcase:false
	try {
		var res = Module._argon2_hash(iterations, memory, parallelism,
			password, passwordLen, salt, saltLen,
			hash, length, encoded, encodedLen, type, version);
		if (res) {
			return Promise.reject('Argon2 error ' + res);
		}
		var hashArr = new Uint8Array(length);
		for (var i = 0; i < length; i++) {
			hashArr[i] = Module.HEAP8[hash + i];
		}
		Module._free(password);
		Module._free(salt);
		Module._free(hash);
		Module._free(encoded);
		return Promise.resolve(hashArr);
	} catch (e) {
		return Promise.reject(e);
	}
}

export {
	argon2
}