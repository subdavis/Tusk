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
 * Storage in background page memory.
 */
module.exports = function SecureCacheMemory(protectedMemory) {
  var exports = {}

  var awaiting = [];
  var messageReceived;
  var notifyReady;
  var ready = new Promise(function(resolve) {
    notifyReady = resolve;
  });
  exports.ready = function() {
    return ready.then(function(port) {
      return true;
    });
  };

  var promise = new Promise(function(resolve, reject) {
    messageReceived = resolve;
  });

  //init.  get tabId and open a port
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tabs) {
    if (tabs !== undefined && tabs.length > 0) {
      var port = chrome.runtime.connect({
        name: "tab" + tabs[0].id
      });
      console.log(port)
      notifyReady(port);
    }
  });

  ready.then(function(port) {
    port.onMessage.addListener(function(serializedSavedState) {
      //called from the background when we get a response, i.e. some saved state.
      var savedState = protectedMemory.hydrate(serializedSavedState);
      var notifier = awaiting.shift();
      notifier(savedState); //notify others
    });
    port.onDisconnect.addListener(function(p) {
      console.log(p)
    })
  });

  //wake up the background page and get a pipe to send/receive messages:
  exports.get = function(key) {
    ready.then(function(port) {
      port.postMessage({
        action: 'get',
        key: key
      });
    });

    var p = new Promise(function(resolve) {
      awaiting.push(resolve);
    });

    return p; //will resolve when we get something
  }

  exports.clear = function() {
    return ready.then(function(port) {
      console.log(port)
      port.postMessage({
        action: 'clear'
      });
    })
  }

  exports.save = function(key, value) {
    return ready.then(function(port) {
      var serializedValue = protectedMemory.serialize(value);
      port.postMessage({
        action: 'save',
        key: key,
        value: serializedValue
      });
    })
  }

  return exports;
}
