/**

The MIT License (MIT)

Copyright (c) 2015 Steven Campbell.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

"use strict";

/**
* Shared state and methods for an unlocked password file.
*/
function UnlockedState($interval, $location, keepass, protectedMemory) {
  var my = {
    tabId: "",  //tab id of current tab
    url: "",    //url of current tab
    title: "",  //window title of current tab
    origin: "", //url of current tab without path or querystring
    sitePermission: false,  //true if the extension already has rights to autofill the password
    entries: null,  //filtered password database entries
    streamKey: null,  //key for accessing protected data fields
    clipboardStatus: ""  //status message about clipboard, used when copying password to the clipboard
  };
  var streamKey, copyEntry;

  //determine current url:
  my.getTabDetails = function() {
    return new Promise(function(resolve, reject) {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function(tabs) {
        if (tabs && tabs.length) {
          my.tabId = tabs[0].id;
          var url = tabs[0].url.split('?');
          my.url = url[0];
          my.title = tabs[0].title;

          var parsedUrl = parseUrl(tabs[0].url);
          my.origin = parsedUrl.protocol + '//' + parsedUrl.hostname + '/';

          chrome.p.permissions.contains({
            origins: [my.origin]
          })
          .then(function() {
            my.sitePermission = true;
          })
          .catch(function(err) {
            my.sitePermission = false;
          })
          .then(function() {
            resolve();
          })
        } else {
          reject(new Error("Unable to determine tab details"));
        }
      });
    });
  };

  my.clearBackgroundState = function() {
    my.entries = null;
    my.streamKey = null;
    my.clipboardStatus = "";
  }

  my.autofill = function(entry) {
    chrome.runtime.sendMessage({
      m: "requestPermission",
      perms: {
        origins: [my.origin]
      },
      then: {
        m: "autofill",
        tabId: my.tabId,
        u: entry.userName,
        p: entry.protectedData ? keepass.getDecryptedEntry(entry.protectedData.password, my.streamKey): entry.password,
        o: my.origin
      }
    });

    window.close(); //close the popup
  }

  my.copyPassword = function(entry) {
    copyEntry = entry;
    entry.copied = true;
    document.execCommand('copy');
  }

  my.gotoDetails = function(entry) {
  	$location.path('/entry-details/' + entry.id);
  }

  my.getDecryptedAttribute = function(protectedAttr) {
  	return keepass.getDecryptedEntry(protectedAttr, my.streamKey);
  }

  //listens for the copy event and does the copy
  var timerInstance;
  document.addEventListener('copy', function(e) {
    if (!copyEntry) {
      return; //listener can get registered multiple times
    }

    var textToPutOnClipboard = copyEntry.protectedData ? keepass.getDecryptedEntry(copyEntry.protectedData.password, my.streamKey): copyEntry.password;
    copyEntry = null;
    e.clipboardData.setData('text/plain', textToPutOnClipboard);
    e.preventDefault();

    chrome.alarms.clear("clearClipboard", function() {
      chrome.alarms.create("clearClipboard", {
        delayInMinutes: 1
      });
    })

    //actual clipboard clearing occurs on the background task via alarm, this is just for user feedback:
    my.clipboardStatus = "Copied to clipboard.  Clipboard will clear in 60 seconds."
    var seconds = 60;
    if (timerInstance) {
      //cancel previous timer
      $interval.cancel(timerInstance)
    }

    //do timer to show countdown
    timerInstance = $interval(function() {
      seconds -= 1;
      if (seconds <= 0) {
        my.clipboardStatus = "Clipboard cleared"
        $interval.cancel(timerInstance);
      } else {
        my.clipboardStatus = "Copied to clipboard.  Clipboard will clear in " + seconds + " seconds."
      }
    }, 1000);
  });

  function parseUrl(url) {
    //from https://gist.github.com/jlong/2428561
    var parser = document.createElement('a');
    parser.href = url;

    /*
    parser.protocol; // => "http:"
    parser.hostname; // => "example.com"
    parser.port;     // => "3000"
    parser.pathname; // => "/pathname/"
    parser.search;   // => "?search=test"
    parser.hash;     // => "#hash"
    parser.host;     // => "example.com:3000"
    */

    return parser;
  }

  return my;
}
