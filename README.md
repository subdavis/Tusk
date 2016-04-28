# CKP
Chrome extension for interacting with KeePass password file.  Still in beta.  Web Store url is https://chrome.google.com/webstore/detail/lnfepbjehgokldcaljagbmchhnaaogpc.   Give it a try!

More info available at http://perfectapi.github.io/CKP/

## Running or Updating the code locally
If you want to hack on the code...

Tools needed:
* [Node.Js](http://nodejs.org/) - prerequisite for other dev tools
* [Grunt.js](gruntjs.com) - for less/css processing, packaging, and copying libs to the lib folder
* [Bower](http://bower.io/) - for dependencies (libraries)

1) Clone the codebase 

    git clone https://github.com/perfectapi/CKP.git
    cd CKP

2) Install the dependencies. 

    npm install
    bower install 

3) Copy the dependencies to their lib location.  

    grunt updatelib

4) If you are editing ```.less``` files then run ```grunt watch``` to compile them when they change.

## Installing in chrome ##
To install the code in Chrome, open **More Tools\Extensions**, check the **Developer mode** checkbox.  Click **Load unpacked extension** and browse to the folder where you cloned the code.  

You may find the [Chrome Apps & Extensions Developer Tool](https://chrome.google.com/webstore/detail/chrome-apps-extensions-de/ohmmkhmmmpcnpikjeljgnaoabkaalbgc) to be helpful when debugging the background page.


## Running tests ##

Open ```./tests/services.html``` in your browser
