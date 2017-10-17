# CKPX

Chrome extension for interacting with KeePass password file.

Due to the inactivity of [CKP](https://github.com/perfectapi/CKP), CKPX now exists as an independent fork.  The name CKPX was chosen as homage to KeePassX, an independent derivative of KeePass.

## Running or Updating the code locally

To configure a development environment...

1) Aquire the necessary tools:
    * [Node.Js](http://nodejs.org/) - prerequisite for other dev tools
    * [Grunt.js](gruntjs.com) - for less/css processing, packaging, and copying libs to the lib folder
    * [Bower](http://bower.io/) - for dependencies (libraries)

2) Clone the codebase
	
    ```
    git clone https://github.com/subdavis/CKPX.git
    cd CKPX
    ```

3) Install the dependencies. 

    ```
    npm install
    bower install 
    ```

4) Copy the dependencies to their lib location.  

    ```
    grunt updatelib
    ```

5) If you are editing ```.less``` files then run ```grunt watch``` to compile them when they change.

## Installing in chrome ##

Install the latest stable version from [Chorme Web Store](https://chrome.google.com/webstore/detail/fmhmiaejopepamlcjkncpgpdjichnecm).

To install the code manually in Chrome, open **More Tools\Extensions**, check the **Developer mode** checkbox.  Click **Load unpacked extension** and browse to the folder where you cloned the code.  

You may find the [Chrome Apps & Extensions Developer Tool](https://chrome.google.com/webstore/detail/chrome-apps-extensions-de/ohmmkhmmmpcnpikjeljgnaoabkaalbgc) to be helpful when debugging the background page.


## Running tests ##

Open ```./tests/services.html``` in your browser
