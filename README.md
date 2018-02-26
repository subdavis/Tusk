# Tusk
> A modern, clean keepass browser extension built with Vue.js and kdbxweb.  Rebooted from perfectapi/CKP

![Tusk](https://github.com/subdavis/Tusk/blob/develop/assets/icons/logo_256.png "Tusk Logo")

## Installation

**Firefox:** https://addons.mozilla.org/en-GB/firefox/addon/keepass-tusk/

**Chrome:** https://chrome.google.com/webstore/detail/fmhmiaejopepamlcjkncpgpdjichnecm

#### User Guide + Other Docs

* Wiki https://github.com/subdavis/Tusk/wiki
* Website https://subdavis.com/Tusk

## Tusk Custom Fields

The following custom fields in a keepass entry are supported and affect the behavior of Tusk.

* `TUSK_URLS`: a comma separated list of URLs or hostnames to which the entry should always match.  For example, active directory login credentials that must match several sites.  e.g. `my.login.domain.com,https://github.com,foobar.net`

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

# build the tests
yarn build-tests

# static reload with file watch for tests
yarn watch-tests
```

For detailed explanation on how things work, consult the [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Running tests

To run tests, first build them with `yarn build-tests` or `yarn watch-tests` then open `tests/test.html` in a browser.s

## Browser Permissions

> Tusk requires cross-origin permissions in order to inject credentials and query the storage backends on the user's behalf.

In chrome, these permissions requests are __always__ promted to the user upon first use.

Because of Firefox's implementation of `browser.permissions`, it was necessary to request all permissions at install time to avoid code rot.  A deeper explanation of the firefox permissions can be found [on stackoverflow](https://stackoverflow.com/questions/47723297/firefox-extension-api-permissions-request-may-only-be-called-from-a-user-input)

## FAQ

> Why is it called Tusk?!

I originally wanted to call it *Elephant*, as in *An elephant never forgets.*  I tried this name on a couple of friends and they were unimpressed. I wanted to find a name that was more concise but keep the elephant imagery.  Ergo, tusk.

> What happened to CKPX?

This is it! CKPX has been rebranded as Tusk to mark its Firefox release.  The C in CKPX stood for 'Chrome'.

> Can I donate money?

I don't want your money.  Take whatever you would have given me and find a local charity.  None of this multinational wounded-warrior-project-farse nonsense either.  Find a local food bank or a women's shelter or an animal shelter.  Enjoy your free software. 

> Can I support Tusk?

If you <3 Tusk, please consider leaving a positive review on [the Firefox Add-on store](https://addons.mozilla.org/en-GB/firefox/addon/keepass-tusk/) or [the Chrome webstore](https://chrome.google.com/webstore/detail/fmhmiaejopepamlcjkncpgpdjichnecm) - I'll be eternally grateful.
