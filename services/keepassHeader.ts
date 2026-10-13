export interface KeepassFileHeader {
  sigKeePass: number;
  sigKeePassType: number;
  kdbx?: boolean;
}

const littleEndian = (() => {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true);
  return new Int16Array(buffer)[0] === 256;
})();

const DBSIG_KEEPASS = 0x9aa2d903;
const DBSIG_KDBX = 0xb54bfb67;
const DBSIG_KDBX_ALPHA = 0xb54bfb66;
const DBSIG_KDB = 0xb54bfb55;
const DBSIG_KDB_NEW = 0xb54bfb65;

/**
 * Only sniffs the 8-byte file signature to detect whether a file is a KDBX
 * database (kdbxweb.Kdbx.load does the real header/field parsing from there).
 * Old KDB (v1) files are detected but not supported - keepassService throws
 * for them - so their field layout is intentionally not parsed here.
 */
export class KeepassHeader {
  readHeader(buf: ArrayBuffer): KeepassFileHeader {
    const sigHeader = new DataView(buf, 0, 8);
    const h: KeepassFileHeader = {
      sigKeePass: sigHeader.getUint32(0, littleEndian),
      sigKeePassType: sigHeader.getUint32(4, littleEndian),
    };

    if (
      h.sigKeePass != DBSIG_KEEPASS ||
      (h.sigKeePassType != DBSIG_KDBX &&
        h.sigKeePassType != DBSIG_KDBX_ALPHA &&
        h.sigKeePassType != DBSIG_KDB &&
        h.sigKeePassType != DBSIG_KDB_NEW)
    ) {
      console.error(
        'Signature fail.  sig 1:' +
          h.sigKeePass.toString(16) +
          ', sig2:' +
          h.sigKeePassType.toString(16)
      );
      throw new Error('This is not a valid KeePass file - file signature is not correct.');
    }

    if (h.sigKeePassType == DBSIG_KDBX || h.sigKeePassType == DBSIG_KDBX_ALPHA) {
      h.kdbx = true;
    }

    return h;
  }
}
