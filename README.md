# ChromeKeePass
Chrome extension for interacting with KeePass password file.  Still in beta.  Web Store url is https://chrome.google.com/webstore/detail/lnfepbjehgokldcaljagbmchhnaaogpc.   Give it a try!

## Motivation
[KeePass](http://keepass.info/) password files work well for me on Windows, but on my Chromebook there were no good options to access them.  

Chrome recently implemented the [Web Crypto API](http://www.w3.org/TR/WebCryptoAPI/), so it became practical to write JavaScript code that could parse a KeePass file.  I decided to utilize those to create the extension that I wished existed - one that lets me control my own passwords in a secure format, is simple to use, and does not require any special permissions (i.e. **no** "Access your browse data on all sites").

## Major Features
* Zero permissions required to install
* Works with KeePass v1 (.kdb) and v2 (.kdbx) files, with any combination of key file and master password
* Retrieves KeePass password file from Google Drive, or static copies can be stored in Chrome storage
* Smart matching of password entry to website, so that you don't have to manually search for your entry
* Manual searching of entries, for those wierd edge cases
* Fills in password on website, no need to copy-paste!  (But if you prefer not to grant permission, you can still use copy-paste)
* Anti-phishing detection - warns if the site is not the one that ChromeKeePass remembers
* Passwords are always encrypted in memory (except briefly when you actually use them!)

## Additional features
* Easily switch between multiple password database files
* Automatic unlock of key-only databases

## Known Limitations
File browse dialog may cause the popup to close on some OS's.  It is confirmed to do that on Xubuntu and on some Windows machines.  It works 100% on ChromeOS, and works ok on Mac.  

The extension does not work in incognito mode.

The extension icon activates on pages with iframes, even when there are no password fields.

## Running or Updating the code locally
If you want to hack on the code...

Tools needed:
* [Grunt.js](gruntjs.com) - for less/css processing, packaging, and copying libs to the lib folder
* [Bower](http://bower.io/) - for dependencies (libraries)

Clone the codebase, and then (from the code folder) run ```bower install``` to install the dependencies.  Then ```grunt updatelib``` to copy the dependencies to their lib location.  If you are editing ```.less``` files then run ```grunt watch``` to compile them when they change.

To install in Chrome, open More Tools\Extensions, check the "Developer mode" checkbox.  Click "Load unpacked extension" and browse to the folder where you cloned the code.  You may find the [Chrome Apps & Extensions Developer Tool](https://chrome.google.com/webstore/detail/chrome-apps-extensions-de/ohmmkhmmmpcnpikjeljgnaoabkaalbgc) to be helpful when debugging the background page.
