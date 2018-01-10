# Tusk

> A modern, clean keepass browser extension built with Vue.js and kdbxweb.  Rebooted from perfectapi/CKP

![Tusk](https://github.com/subdavis/Tusk/blob/develop/assets/icons/logo_256.png "Tusk Logo")

## Installation

**Firefox:** https://addons.mozilla.org/en-GB/firefox/addon/keepass-tusk/

**Chrome:** https://chrome.google.com/webstore/detail/fmhmiaejopepamlcjkncpgpdjichnecm

## Build Setup

Tusk requires:
* `node`
* `npm`
* `gulp`
* `yarn`

```bash
# install dependencies
yarn install

# static reload with file watch
yarn watch

# build for production with minification
yarn build

# run the packer script targeted for 'chrome' or 'firefox' after build
yarn bundle
```

For detailed explanation on how things work, consult the [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Browser Permissions

> Tusk requires cross-origin permissions in order to inject credentials and query the storage backends on the user's behalf.

In chrome, these permissions requests are __always__ promted to the user upon first use.

Because of Firefox's implementation of `browser.permissions`, it was necessary to request all permissions at install time to avoid code rot.  A deeper explanation of the firefox permissions can be found [on stackoverflow](https://stackoverflow.com/questions/47723297/firefox-extension-api-permissions-request-may-only-be-called-from-a-user-input)

## Looking for CKPX?

You found it!  CKPX has been rebranded as Tusk to mark its Firefox release.  The C in CKPX stood for 'Chrome'.
