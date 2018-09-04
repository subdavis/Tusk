"use strict";

import {
    ChromePromiseApi
} from '$lib/chrome-api-promise.js'

const chromePromise = ChromePromiseApi()

/**
 * Shared state and methods for an unlocked password file.
 */
function UnlockedState($router, keepassReference, protectedMemory, settings) {
    var my = {
        tabId: "", //tab id of current tab
        url: "", //url of current tab
        title: "", //window title of current tab
        origin: "", //url of current tab without path or querystring
        sitePermission: false, //true if the extension already has rights to autofill the password
        cache: {}, // a secure cache that refreshes when values are set or fetched
        clipboardStatus: "" //status message about clipboard, used when copying password to the clipboard
    };
    var copyEntry;
    var cacheTimeoutId;

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

                    chromePromise.permissions.contains({
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

    my.clearCache = function() {
        // Destroys an object in memory.
        function destroy(obj) {
            for (var prop in obj) {
                var property = obj[prop];
                if (property != null && typeof(property) == 'object') {
                    destroy(property);
                } else {
                    obj[prop] = null;
                }
            }
        }
        destroy(my.cache)
        my.cache = {}
    }

    my.cacheSet = function(key, val) {
        // Refresh cache
        clearTimeout(cacheTimeoutId)
        cacheTimeoutId = setTimeout(function() {
            my.clearCache()
            window.close()
        }, 120000);
        my.cache[key] = val;
    }

    my.cacheGet = function(key) {
        // Refresh cache
        clearTimeout(cacheTimeoutId)
        cacheTimeoutId = setTimeout(function() {
            my.clearCache()
            window.close()
        }, 120000);
        return my.cache[key];
    }

    my.clearClipboardState = function() {
        my.clipboardStatus = "";
    }
    setTimeout(my.clearClipboardState, 60000); //clear backgroundstate after 1 minutes live - we should never be alive that long

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
                p: getPassword(entry),
                o: my.origin
            }
        });

        window.close(); //close the popup
    }

    //get clear-text password from entry
    function getPassword(entry) {
        return my.getDecryptedAttribute(entry, 'password');
    }

    my.copyPassword = function(entry) {
        copyEntry = entry;
        document.execCommand('copy');
    }

    my.gotoDetails = function(entry) {
        $router.route('/entry-details/' + entry.id);
    }

    my.getDecryptedAttribute = function(entry, attributeName) {
        return keepassReference.getFieldValue(entry, attributeName, my.cache.allEntries);
    }

    //listens for the copy event and does the copy
    document.addEventListener('copy', function(e) {
        if (!copyEntry) {
            return; //listener can get registered multiple times
        }

        var textToPutOnClipboard = getPassword(copyEntry);
        copyEntry = null;
        e.clipboardData.setData('text/plain', textToPutOnClipboard);
        e.preventDefault();

        settings.getSetClipboardExpireInterval().then(interval => {
            settings.setForgetTime('clearClipboard', Date.now() + interval * 60000)
            chrome.runtime.sendMessage({
                m: "showMessage",
                text: 'Password copied to clipboard.  Clipboard will clear in ' + interval + ' minute(s).'
            });
            window.close(); //close the popup
        });

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

export {
    UnlockedState
}