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

/*
  This page runs as an Event page, not a Background page, so don't use global variables
  (they will be lost)
*/

(function() {
  if (chrome.extension.inIncognitoContext) {
    doReplaceRules();
  } else {
    chrome.runtime.onInstalled.addListener(doReplaceRules);
  }

  function doReplaceRules() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      var passwordField = {id: "pwdField", conditions: [
        new chrome.declarativeContent.PageStateMatcher({
            css: ["input[type='password']"]
          })
        ],
        actions: [
          new chrome.declarativeContent.ShowPageAction()
          //new chrome.declarativeContent.RequestContentScript({js: ['keepass.js']})
          ]
      };
      chrome.declarativeContent.onPageChanged.addRules([passwordField]);
    });
  }

  //keep saved state for the popup for as long as we are alive (not long):
  var savedState = {};
  chrome.runtime.onConnect.addListener(function(port) {
    //communicate state on this pipe.  each named port gets its own state.
    if (savedState[port.name]) {
      //we have some saved state that we can give to the popup
      port.postMessage(savedState[port.name]);
    };

    port.onMessage.addListener(function(state) {
      savedState[port.name] = state;
    });

    port.onDisconnect.addListener(function() {
      //uncomment below to forget the state when the popup closes
      //savedState[port.name] = null;
    })
  });

  function handleMessage(message, sender, sendResponse) {
    if (!message || !message.m) return;  //message format unrecognized

    if (message.m == "requestPermission") {
      //better to do the request here on the background, because on some platforms
      //the popup may close prematurely when requesting access
      chrome.permissions.contains(message.perms, function(alreadyGranted) {
        if (chrome.runtime.lastError || (alreadyGranted && message.then)) {
          handleMessage(message.then, sender, sendResponse);
        } else {
          //request
          chrome.permissions.request(message.perms, function(granted){
            if (granted && message.then) {
              handleMessage(message.then, sender, sendResponse);
            }
          });
        }
      });
    }

    if (message.m == "autofill") {
      chrome.tabs.executeScript(message.tabId, {
        file: "keepass.js"
      }, function(result) {
        //script injected
        chrome.tabs.sendMessage(message.tabId, {
          m: "fillPassword", u: message.u, p: message.p
        });
      });
    }
  }

  //listen for "autofill" message:
  chrome.runtime.onMessage.addListener(handleMessage);

  //listen for "clear clipboard" alarm:
  chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name == "clearClipboard") {
      //clear the clipboard on timer
      var clearClipboard = function(e) {
        e.clipboardData.setData('text/plain', "");
        e.preventDefault();
        document.removeEventListener('copy', clearClipboard);  //don't listen anymore
      }

      document.addEventListener('copy', clearClipboard);
      document.execCommand('copy');
    }
  });

})();
