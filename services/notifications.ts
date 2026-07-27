import browser from 'webextension-polyfill';
import type { Settings } from './settings';

export interface NotificationData {
  text: string;
  type: string;
  expire?: number;
}

export class Notifications {
  constructor(private settings: Settings) {}

  async push(data: NotificationData) {
    const { text, type, expire } = data;
    const enabledTypes = await this.settings.getSetNotificationsEnabled();
    if (enabledTypes.indexOf(type) === -1) return;
    return browser.runtime.sendMessage({ m: 'showMessage', text, expire });
  }
}
