# ChromeKeePass
Chrome extension for interacting with KeePass password file.  Still in beta.  Web Store url is https://chrome.google.com/webstore/detail/lnfepbjehgokldcaljagbmchhnaaogpc.   Give it a try!

## Motivation
KeePass password files work well enough for me on Windows, but on my Chromebook there was simply no secure way to access them.  Even on Windows, the setup for the keepass-http plugin is convoluted and I'm not sure how secure it is.

Chrome recently implemented the Crypto API, so it became practical to write JavaScript code that could parse a Keepass file.  I decided to utilize those to create the extension that I wished existed - one that lets me control my own passwords in a secure format,does not require any special permissions (i.e. *no* "Access your browse data on all sites").

## Major Features

* Requires minimal permissions to install - done. Zero permissions required to install.
* Decrypts the password file - done.  Works with default KeePass settings on v2 (.kdbx) files.  No plans to work with plugin-provided encryption schemes or v1 files.
* Retrieves KeePass password file from Google Drive - done.  Supports a plugin-provider model, so other types are possible.
* Matches website url or title - done.  Will partial match the website vs. the KeePass entry, and present a filtered list of password entries.
* Ignores Historical and Recycle Bin passwords - done.

## Security

It is a top priority of this project to implement security correctly.  On the wiki, there is a [page describing this in detail](https://github.com/perfectapi/ChromeKeePass/wiki/OWASP-Security-Review).
