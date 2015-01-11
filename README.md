# chrome-keepass
Chrome extension for interacting with keepass password file.  Still in beta.  Web Store url is https://chrome.google.com/webstore/detail/lnfepbjehgokldcaljagbmchhnaaogpc

## Motivation
Keepass password files work well enough for me on Windows, but on my Chromebook there was simply no secure way to access them.  
Even on Windows, the setup for the keepass-http plugin is convoluted and I'm not sure how secure it is.
Chrome recently implemented the Crypto API, so it became possible to write JavaScript code that could parse a Keepass file.  
I decided to utilize those to create the extension that I wished existed - one that lets me control my own passwords in a secure format,
does not require any special permissions (i.e. *no* "Access your browse data on all sites").

## Major Features

* Requires minimal permissions to install.  Working well - zero permissions required to install.
* Decrypts the password file - yep.  Works with default Keepass settings on .kdbx files.  Will not work with plugin-provided encryption schemes.
* Accesses passwords on Google Drive - working well.
* Matches website url or title - working well.  Will partial match the url or title of the website vs. the Keepass entry, and present a matched list of password entries.
* Ignores Historical and Recycle Bin passwords - working well.

## Security Excellence
Still working on it.  My aims are:

* Master password and keys are not stored in memory or storage.  Status = good.  Master password is only in-memory during decryption.
* Clear-text passwords are not stored in memory.  Status = partial.  All passwords are decrypted in-memory 
in the Popup window once you enter your master password.  Ideally none of them should be decrypted until an action occurs to view/copy/use it.
* Extension does not require any special permissions.  Status = excellent.  Extension installs without any permissions, 
and requests access to resources as it needs them the first time.
* Password not copied to clipboard.  Todo - ideally it will fill in the passwords on the page, but this feature is not yet available
on the stable branch of chrome.
