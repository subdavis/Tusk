import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// Fix for __dirname in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

export const port = Number(process.env.PORT || '') || 3305;
export const r = (...args: string[]) => resolve(__dirname, '..', ...args);
export const isDev = process.env.NODE_ENV !== 'production';
export const isFirefox = process.env.EXTENSION === 'firefox';
export const isLocal = process.env.API_ENV === 'local';

export function log(name: string, message: string) {
  console.log(` ${name} `, message);
}
