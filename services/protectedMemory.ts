'use strict';

/**
 * Storage in storage.session, just not in the clear.  Purpose is to prevent seeing the
 * contents in a casual scan of RAM.  Does not prevent an attacker with direct
 * access to the code from reading the contents. Kind of performative, TBH.
 */

import * as Base64 from 'base64-arraybuffer';
import browser from 'webextension-polyfill';

function ProtectedMemory() {
  var my = {
    getData: getData,
    setData: setData,
    clearData: clearData,
    serialize: serialize, //not encrypted
    deserialize: deserialize, //not encrypted
    hydrate: deserialize, //not encrypted
  };

  // Static initialization vector. Again, the point is to prevent casual scanning.
  var AES = {
    name: 'AES-CBC',
    iv: new Uint8Array([151, 130, 214, 18, 4, 148, 135, 72, 253, 242, 1, 203, 18, 45, 45, 180]),
  };

  async function getCryptoKey() {
    const key = (await browser.storage.session.get('__key__'))['__key__'];
    if (key === undefined) {
      const newKey = await crypto.subtle.generateKey(
        {
          name: AES.name,
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
      const exported = await crypto.subtle.exportKey('raw', newKey);
      const serialized = serialize(exported);
      await browser.storage.session.set({ __key__: serialized });
      console.log('Generated protected memory key');
      return newKey;
    }
    const deSerialized = deserialize(key);
    const cryptoKey = await crypto.subtle.importKey('raw', deSerialized, AES.name, false, [
      'encrypt',
      'decrypt',
    ]);
    return cryptoKey;
  }

  async function getData(key: string) {
    var encData = (await browser.storage.session.get(key))[key];
    if (encData === undefined || typeof encData !== 'string') {
      console.log('Cache miss for ' + key);
      return Promise.resolve(undefined);
    }
    console.log('Cache hit for ' + key);
    return getCryptoKey()
      .then((cryptoKey) => {
        var encBytes = Base64.decode(encData);
        return crypto.subtle.decrypt(AES, cryptoKey, encBytes);
      })
      .then(function (data) {
        var decoder = new TextDecoder();
        var decoded = decoder.decode(new Uint8Array(data));
        var parsed = JSON.parse(decoded);
        return dePrepData(parsed);
      });
  }

  function setData(key: string, data: any) {
    console.log('Set cache for ' + key);
    var preppedData = prepData(data);
    var encoder = new TextEncoder();
    var dataBytes = encoder.encode(JSON.stringify(preppedData));
    return getCryptoKey()
      .then((cryptoKey) => {
        return crypto.subtle.encrypt(AES, cryptoKey, dataBytes);
      })
      .then(function (encData) {
        var dataString = Base64.encode(encData);
        return browser.storage.session.set({ [key]: dataString });
      });
  }

  function clearData(key: string) {
    console.log('Clear protected memory.');
    if (key !== undefined) {
      return browser.storage.session.remove(key);
    } else {
      return browser.storage.session.clear();
    }
  }

  function serialize(data: any) {
    var preppedData = prepData(data);
    var encoder = new TextEncoder();
    var dataBytes = encoder.encode(JSON.stringify(preppedData));
    return Base64.encode(dataBytes);
  }

  function deserialize(serializedData: string) {
    if (serializedData === undefined || typeof serializedData !== 'string' || serializedData === '')
      return undefined;

    var dataBytes = Base64.decode(serializedData);
    var decoder = new TextDecoder();
    var decoded = decoder.decode(new Uint8Array(dataBytes));
    var parsed = JSON.parse(decoded);
    return dePrepData(parsed);
  }

  /**
   * Prep data for serializing by converting ArrayBuffer properties to base64 properties
   * Also makes a deep copy, so what is returned is not the original.
   */
  var randomString = 'Ựៅ'; // Base64.encode(crypto.getRandomValues(new Uint8Array(4)));
  function prepData(data: any) {
    if (data === null || data === undefined || typeof data !== 'object') return data;

    if (data.constructor == ArrayBuffer || data.constructor == Uint8Array) {
      return randomString + Base64.encode(data);
    } else if (data.constructor == Array) {
      var newArray = new Array(data.length);
      for (var i = 0; i < data.length; i++) {
        newArray[i] = prepData(data[i]);
      }
      return newArray;
    } else {
      var newObject: Record<string, unknown> = {};
      for (var prop in data) {
        newObject[prop] = prepData(data[prop]);
      }
      return newObject;
    }
  }

  function dePrepData(data: any) {
    if (
      data === null ||
      data === undefined ||
      (typeof data !== 'object' && typeof data !== 'string')
    )
      return data;

    if (typeof data === 'string') {
      if (data.indexOf(randomString) == 0) {
        data = data.slice(randomString.length);
        return new Uint8Array(Base64.decode(data));
      } else {
        return data;
      }
    } else if (data.constructor == Array) {
      for (var i = 0; i < data.length; i++) {
        data[i] = dePrepData(data[i]);
      }
    } else {
      for (var prop in data) {
        data[prop] = dePrepData(data[prop]);
      }
    }

    return data;
  }

  return my;
}

export { ProtectedMemory };
