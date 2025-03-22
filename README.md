# Tusk

> A modern, clean keepass browser extension built with Vue.js and kdbxweb. Rebooted from perfectapi/CKP

![Tusk](https://user-images.githubusercontent.com/25948390/45255427-a466f300-b386-11e8-9321-931934faafb4.png 'Tusk Logo')

## 🧟 Back from the dead 🧟

[Read the release notes](https://github.com/subdavis/Tusk/releases/tag/v2024.8.2) and stay tuned for more updates!

## Installation

**Firefox:** https://addons.mozilla.org/en-GB/firefox/addon/keepass-tusk/

**Chrome:** https://chrome.google.com/webstore/detail/fmhmiaejopepamlcjkncpgpdjichnecm

## User Guide

This section provides how-to instructions for various features of Tusk.

- [WebDAV Support](https://github.com/subdavis/Tusk/wiki/WebDAV-Support) - Support for WebDAV file servers.
- [Custom Fields](https://github.com/subdavis/Tusk/wiki/Custom-Fields) - list of custom fields that Tusk supports.
- [Warnings and Errors](https://github.com/subdavis/Tusk/wiki/Warnings-and-Errors) - An explanation of the messages you may encounter.

#### How it works: Implementation Details

This section provides in-depth information about how tusk works under the hood. We aim to provide better transparency and give users peace-of-mind. Tusk may not be perfect, but it's better than proprietary black-box applications that hide design flaws from the community.

- [Credential Cache Memory](https://github.com/subdavis/Tusk/wiki/Credential-Cache-Memory) - How Tusk can optionally keep your master password cached.
- [Sensitive Data](https://github.com/subdavis/Tusk/wiki/Sensitive-Data) - How Tusk handles sensitive data like KeePass databases and keyfiles.

## Build Setup

Tusk requires:

- `node`
- `yarn`

```bash
# install dependencies
yarn install

# build for production with minification
yarn build
yarn pack:zip

# Hot reload
yarn dev
```

## Running tests

To run tests, first build them with `yarn build-tests` or `yarn watch-tests` then open `tests/test.html` in a browser.

## Browser Permissions

> Tusk requires cross-origin permissions in order to inject credentials and query the storage backends on the user's behalf.

In chrome, these permissions requests are **always** prompted to the user upon first use.

Because of Firefox's implementation of `browser.permissions`, it was necessary to request all permissions at install time to avoid code rot. A deeper explanation of the firefox permissions can be found [on stackoverflow](https://stackoverflow.com/questions/47723297/firefox-extension-api-permissions-request-may-only-be-called-from-a-user-input)

## FAQ

> Why is it called Tusk?!

I originally wanted to call it _Elephant_, as in _An elephant never forgets._ I tried this name on a couple of friends and they were unimpressed. I wanted to find a name that was more concise but keep the elephant imagery. Ergo, tusk.

> What happened to CKPX?

This is it! CKPX has been rebranded as Tusk to mark its Firefox release. The C in CKPX stood for 'Chrome'.

> How can I support Tusk?

If you ❤️ Tusk, please consider leaving a positive review on [the Firefox Add-on store](https://addons.mozilla.org/en-GB/firefox/addon/keepass-tusk/) or [the Chrome webstore](https://chrome.google.com/webstore/detail/fmhmiaejopepamlcjkncpgpdjichnecm) - I'll be eternally grateful.

> Who made that awesome logo?

A super cool artist and graphic designer named [Gabriel Garcia](https://github.com/ggabogarcia)! Thanks for our logo!
