/**
 * Storage in storage.session, just not in the clear.  Purpose is to prevent seeing the
 * contents in a casual scan of RAM.  Does not prevent an attacker with direct
 * access to the code from reading the contents. Kind of performative, TBH.
 */

import * as Base64 from 'base64-arraybuffer';
import browser from 'webextension-polyfill';

export type Serializable =
  | null
  | undefined
  | string
  | number
  | boolean
  | ArrayBuffer
  | Uint8Array
  | Serializable[]
  | { [key: string]: Serializable };

// Static initialization vector. Again, the point is to prevent casual scanning.
const AES = {
  name: 'AES-CBC',
  iv: new Uint8Array([151, 130, 214, 18, 4, 148, 135, 72, 253, 242, 1, 203, 18, 45, 45, 180]),
};

// Base64.encode(crypto.getRandomValues(new Uint8Array(4)));
const randomString = 'Ựៅ';

function toArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  return data instanceof ArrayBuffer ? data : (new Uint8Array(data).buffer as ArrayBuffer);
}

/**
 * Prep data for serializing by converting ArrayBuffer/Uint8Array properties to base64
 * strings. Also makes a deep copy, so what is returned is not the original.
 */
function prepData(data: Serializable): Serializable {
  if (data === null || data === undefined || typeof data !== 'object') return data;

  if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
    return randomString + Base64.encode(toArrayBuffer(data));
  } else if (Array.isArray(data)) {
    return data.map((item) => prepData(item));
  } else {
    const newObject: Record<string, Serializable> = {};
    for (const prop in data) {
      newObject[prop] = prepData(data[prop]);
    }
    return newObject;
  }
}

function dePrepData(data: unknown): unknown {
  if (data === null || data === undefined || (typeof data !== 'object' && typeof data !== 'string'))
    return data;

  if (typeof data === 'string') {
    if (data.indexOf(randomString) === 0) {
      return new Uint8Array(Base64.decode(data.slice(randomString.length)));
    }
    return data;
  } else if (Array.isArray(data)) {
    return data.map((item) => dePrepData(item));
  } else {
    const result: Record<string, unknown> = {};
    for (const prop in data as Record<string, unknown>) {
      result[prop] = dePrepData((data as Record<string, unknown>)[prop]);
    }
    return result;
  }
}

export class ProtectedMemory {
  private async getCryptoKey(): Promise<CryptoKey> {
    const key = (await browser.storage.session.get('__key__'))['__key__'] as string | undefined;
    if (key === undefined) {
      const newKey = await window.crypto.subtle.generateKey({ name: AES.name, length: 256 }, true, [
        'encrypt',
        'decrypt',
      ]);
      const exported = await window.crypto.subtle.exportKey('raw', newKey);
      const serialized = this.serialize(exported);
      await browser.storage.session.set({ __key__: serialized });
      console.log('Generated protected memory key');
      return newKey;
    }
    const deSerialized = this.deserialize(key) as ArrayBuffer;
    return window.crypto.subtle.importKey('raw', deSerialized, AES.name, false, [
      'encrypt',
      'decrypt',
    ]);
  }

  async getData<T = unknown>(key: string): Promise<T | undefined> {
    const encData = (await browser.storage.session.get(key))[key];
    if (encData === undefined || typeof encData !== 'string') {
      console.log('Cache miss for ' + key);
      return undefined;
    }
    console.log('Cache hit for ' + key);
    const cryptoKey = await this.getCryptoKey();
    const encBytes = Base64.decode(encData);
    const data = await window.crypto.subtle.decrypt(AES, cryptoKey, encBytes);
    const decoded = new TextDecoder().decode(new Uint8Array(data));
    return dePrepData(JSON.parse(decoded)) as T;
  }

  async setData<T extends Serializable>(key: string, data: T): Promise<void> {
    console.log('Set cache for ' + key);
    const preppedData = prepData(data);
    const dataBytes = new TextEncoder().encode(JSON.stringify(preppedData));
    const cryptoKey = await this.getCryptoKey();
    const encData = await window.crypto.subtle.encrypt(AES, cryptoKey, dataBytes);
    const dataString = Base64.encode(encData);
    await browser.storage.session.set({ [key]: dataString });
  }

  async clearData(key?: string): Promise<void> {
    console.log('Clear protected memory.');
    if (key !== undefined) {
      await browser.storage.session.remove(key);
    } else {
      await browser.storage.session.clear();
    }
  }

  /** not encrypted */
  serialize(data: Serializable): string {
    const preppedData = prepData(data);
    const dataBytes = new TextEncoder().encode(JSON.stringify(preppedData));
    return Base64.encode(dataBytes.buffer);
  }

  /** not encrypted */
  deserialize(serializedData: string | undefined): unknown {
    if (serializedData === undefined || typeof serializedData !== 'string' || serializedData === '')
      return undefined;

    const dataBytes = Base64.decode(serializedData);
    const decoded = new TextDecoder().decode(new Uint8Array(dataBytes));
    return dePrepData(JSON.parse(decoded));
  }

  /** not encrypted */
  hydrate(serializedData: string | undefined): unknown {
    return this.deserialize(serializedData);
  }
}
