import browser from 'webextension-polyfill';
import { ref, type Ref } from 'vue';
import { hasOriginPermission, parseUrl } from '@/lib/utils';
import type { KeepassReference } from './keepassReference';
import type { Notifications } from './notifications';
import type { Settings } from './settings';
import type { Entry } from './types';

export interface PendingClipboardCopy {
  fieldName: string;
  value: string;
}

/**
 * Shared state and methods for an unlocked password file.
 */
export class UnlockedState {
  tabId = 0; // tab id of current tab
  url = ''; // url of current tab
  title = ''; // window title of current tab
  origin = ''; // url of current tab without path or querystring
  sitePermission = false; // true if the extension already has rights to autofill the password
  cache: Record<string, unknown> = {}; // a secure cache that refreshes when values are set or fetched
  clipboardStatus = ''; // status message about clipboard, used when copying password to the clipboard
  unlocked: Ref<boolean> = ref(false);

  private cacheTimeoutId?: ReturnType<typeof setTimeout>;
  private pendingCopy: { entry: Entry; field: string } | null = null;

  constructor(
    private keepassReference: KeepassReference,
    private settings: Settings,
    private notifications: Notifications
  ) {
    setTimeout(() => this.clearClipboardState(), 60000); // clear backgroundstate after 1 minutes live - we should never be alive that long
  }

  // determine current url:
  async getTabDetails(): Promise<void> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length || tabs[0].id === undefined || !tabs[0].url) {
      throw new Error('Unable to determine tab details');
    }
    this.tabId = tabs[0].id;
    this.url = tabs[0].url.split('?')[0];
    this.title = tabs[0].title ?? '';

    const parsedUrl = parseUrl(tabs[0].url);
    this.origin = parsedUrl ? parsedUrl.protocol + '//' + parsedUrl.hostname + '/' : '';

    this.sitePermission = await hasOriginPermission([this.origin]);
  }

  clearCache() {
    console.log('Clearing cache');
    destroy(this.cache);
    this.unlocked.value = false;
    this.cache = {};
    console.log('locked', this.unlocked.value);
  }

  cacheSet(key: string, val: unknown) {
    this.refreshCacheTimeout();
    console.log('Setting cache for ' + key);
    this.cache[key] = val;
    this.unlocked.value = true;
  }

  cacheGet<T = unknown>(key: string): T {
    this.refreshCacheTimeout();
    return this.cache[key] as T;
  }

  private refreshCacheTimeout() {
    clearTimeout(this.cacheTimeoutId);
    this.cacheTimeoutId = setTimeout(() => {
      this.clearCache();
      window.close();
    }, 120000);
  }

  clearClipboardState() {
    this.clipboardStatus = '';
  }

  autofill(entry: Entry) {
    browser.runtime.sendMessage({
      m: 'requestPermission',
      perms: { origins: [this.origin] },
      then: {
        m: 'autofill',
        tabId: this.tabId,
        u: entry.userName,
        p: this.getDecryptedAttribute(entry, 'password'),
        o: this.origin,
      },
    });

    window.close(); // close the popup
  }

  copyPassword(entry: Entry) {
    this.pendingCopy = { entry, field: 'password' };
    document.execCommand('copy');
  }

  copyUsername(entry: Entry) {
    this.pendingCopy = { entry, field: 'userName' };
    document.execCommand('copy');
  }

  getDecryptedAttribute(entry: Entry, attributeName: string): string {
    return this.keepassReference.getFieldValue(
      entry,
      attributeName,
      this.cache.allEntries as Entry[]
    );
  }

  /** Called by useUnlockedStateClipboard's `copy` event listener. */
  consumeClipboardPayload(): PendingClipboardCopy | null {
    if (!this.pendingCopy) return null;
    const { entry, field } = this.pendingCopy;
    this.pendingCopy = null;
    const value = this.getDecryptedAttribute(entry, field);
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1); // https://stackoverflow.com/a/1026087
    return { fieldName, value };
  }

  async onClipboardCopied(fieldName: string) {
    const interval = await this.settings.getSetClipboardExpireInterval();
    await this.settings.setForgetTime('clearClipboard', Date.now() + interval * 60000);
    await this.notifications.push({
      text:
        fieldName + ' copied to clipboard.  Clipboard will clear in ' + interval + ' minute(s).',
      type: 'clipboard',
    });
    window.close();
  }
}

/** Destroys an object in memory. */
function destroy(obj: Record<string, unknown>) {
  for (const prop in obj) {
    const property = obj[prop];
    if (property != null && typeof property === 'object') {
      destroy(property as Record<string, unknown>);
    } else {
      obj[prop] = null;
    }
  }
}
