export interface OtpParams {
  type: string;
  account?: string;
  secret: string;
  issuer?: string;
  algorithm?: string;
  digits?: string | number;
  counter?: number;
  period?: string | number;
}

export type OtpCallback = (err: unknown, pass?: string, timeLeft?: number) => void;

export class Otp {
  url: string;
  type: string;
  account?: string;
  secret: string;
  issuer?: string;
  algorithm: string;
  digits: number;
  counter?: number;
  period: number;
  key: ArrayBuffer;

  constructor(url: string, params: OtpParams) {
    if (['hotp', 'totp'].indexOf(params.type) < 0) {
      throw new Error('Bad type: ' + params.type);
    }
    if (!params.secret) {
      throw new Error('Empty secret');
    }
    if (params.algorithm && ['SHA1', 'SHA256', 'SHA512'].indexOf(params.algorithm) < 0) {
      throw new Error('Bad algorithm: ' + params.algorithm);
    }
    if (params.digits && ['6', '7', '8'].indexOf(String(params.digits)) < 0) {
      throw new Error('Bad digits: ' + params.digits);
    }
    if (params.type === 'hotp' && !params.counter) {
      throw new Error('Bad counter: ' + params.counter);
    }
    if ((params.period && isNaN(Number(params.period))) || Number(params.period) < 1) {
      throw new Error('Bad period: ' + params.period);
    }

    this.url = url;
    this.type = params.type;
    this.account = params.account;
    this.secret = params.secret;
    this.issuer = params.issuer;
    this.algorithm = params.algorithm ? params.algorithm.toUpperCase() : 'SHA1';
    this.digits = params.digits ? +params.digits : 6;
    this.counter = params.counter;
    this.period = params.period ? +params.period : 30;

    const key = Otp.fromBase32(this.secret);
    if (!key) {
      throw new Error('Bad key: ' + this.secret);
    }
    this.key = key;
  }

  next(callback: OtpCallback) {
    let valueForHashing: number;
    let timeLeft: number | undefined;
    if (this.type === 'totp') {
      const now = Date.now();
      const epoch = Math.round(now / 1000);
      valueForHashing = Math.floor(epoch / this.period);
      const msPeriod = this.period * 1000;
      timeLeft = msPeriod - (now % msPeriod);
    } else {
      valueForHashing = this.counter as number;
    }
    const data = new Uint8Array(8).buffer;
    new DataView(data).setUint32(4, valueForHashing);
    this.hmac(data, (sig, err) => {
      if (!sig) {
        console.error('OTP calculation error', err);
        return callback(err);
      }
      const sigView = new DataView(sig);
      const offset = sigView.getInt8(sigView.byteLength - 1) & 0xf;
      const hmac = sigView.getUint32(offset) & 0x7fffffff;
      const pass =
        this.issuer === 'Steam' ? Otp.hmacToSteamCode(hmac) : Otp.hmacToDigits(hmac, this.digits);
      callback(null, pass, timeLeft);
    });
  }

  private hmac(data: ArrayBuffer, callback: (sig: ArrayBuffer | null, err?: unknown) => void) {
    const subtle = window.crypto.subtle;
    const algo = { name: 'HMAC', hash: { name: this.algorithm.replace('SHA', 'SHA-') } };
    subtle
      .importKey('raw', this.key, algo, false, ['sign'])
      .then((key) => {
        subtle
          .sign(algo, key, data)
          .then((sig) => callback(sig))
          .catch((err) => callback(null, err));
      })
      .catch((err) => callback(null, err));
  }

  static hmacToDigits(hmac: number, length: number): string {
    const code = hmac.toString();
    return Otp.leftPad(code.substr(code.length - length), length);
  }

  static hmacToSteamCode(hmac: number): string {
    const steamChars = '23456789BCDFGHJKMNPQRTVWXY';
    let code = '';
    for (let i = 0; i < 5; ++i) {
      code += steamChars.charAt(hmac % steamChars.length);
      hmac /= steamChars.length;
    }
    return code;
  }

  static fromBase32(str: string): ArrayBuffer | null {
    str = str.replace(/\s/g, '');
    const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
    let bin = '';
    for (let i = 0; i < str.length; i++) {
      const ix = alphabet.indexOf(str[i].toLowerCase());
      if (ix < 0) {
        return null;
      }
      bin += Otp.leftPad(ix.toString(2), 5);
    }
    const hex = new Uint8Array(Math.floor(bin.length / 8));
    for (let i = 0; i < hex.length; i++) {
      const chunk = bin.substr(i * 8, 8);
      hex[i] = parseInt(chunk, 2);
    }
    return hex.buffer;
  }

  static leftPad(str: string, len: number): string {
    while (str.length < len) {
      str = '0' + str;
    }
    return str;
  }

  static parseUrl(url: string): Otp {
    const match = /^otpauth:\/\/(\w+)(?:\/([^?]+)\?|\?)(.*)/i.exec(url);
    if (!match) {
      throw new Error('Not OTP url');
    }
    const params: Partial<OtpParams> & Record<string, string> = { type: '', secret: '' };
    const label = decodeURIComponent(match[2] ?? 'default');
    if (label) {
      const parts = label.split(':');
      params.issuer = parts[0].trim();
      if (parts.length > 1) {
        params.account = parts[1].trim();
      }
    }
    params.type = match[1].toLowerCase(); // returns "totp"
    // match[3] =  secret=XXXXXXXXXXXXX&period=30&digits=6&algorithm=SHA1
    match[3].split('&').forEach((part) => {
      const parts = part.split('=', 2);
      params[parts[0].toLowerCase()] = decodeURIComponent(parts[1]);
    });
    return new Otp(url, params as OtpParams);
  }

  static isSecret(str: string): boolean {
    return !!Otp.fromBase32(str);
  }

  static makeUrl(secret: string, period?: string | number, digits?: string | number): string {
    return (
      'otpauth://totp/default?secret=' +
      secret +
      (period ? '&period=' + period : '') +
      (digits ? '&digits=' + digits : '')
    );
  }
}
