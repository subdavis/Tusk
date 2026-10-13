import browser from 'webextension-polyfill';

export class Links {
  open(url: string) {
    browser.tabs.create({ url });
  }

  private openOptionsPath(path: string) {
    // A hack to figure out what the browser uses to point to us.
    // For example, chrome says we will always be chrome-extension://fmhmiaejopepamlcjkncpgpdjichnecm/...
    const loc = window.location.origin;
    browser.tabs.create({ url: loc + path });
  }

  openOptions() {
    browser.runtime.openOptionsPage();
  }

  openOptionsDatabases() {
    this.openOptionsPath('/dist/options.html#/manage/databases');
  }

  openOptionsKeyfiles() {
    this.openOptionsPath('/dist/options.html#/manage/keyfiles');
  }

  openOptionsReauth(reauthId: string) {
    this.openOptionsPath('/dist/options.html#/reauthorize/' + reauthId);
  }

  openWebstore() {
    browser.tabs.create({
      url: 'https://chrome.google.com/webstore/detail/ckpx-chrome-keepass-exten/fmhmiaejopepamlcjkncpgpdjichnecm',
    });
  }

  openHomepage() {
    browser.tabs.create({ url: 'https://subdavis.com/Tusk' });
  }
}
