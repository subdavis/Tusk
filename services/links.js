"use strict";

//simple service to link to the options page
function Links() {
    var my = {
        openOptions: openOptions,
        openWebstore: openWebstore,
        openHomepage: openHomepage,
        openOptionsReauth: openOptionsReauth,
        openOptionsKeyfiles: openOptionsKeyfiles,
        openOptionsDatabases: openOptionsDatabases,
        open: openGeneric
    }

    function openGeneric(url) {
        // Given some URL, open it in a new tab
        chrome.tabs.create({
            url: url
        })
    }

    function openOptionsPath(path) {
        // A hack to figure out what the browser uses to point to us.
        // For example, chrome says we will always be chrome-extension://fmhmiaejopepamlcjkncpgpdjichnecm/...
        let loc = window.location.origin;
        chrome.tabs.create({
            url: loc + path
        })
    }

    function openOptions() {
        openOptionsWelcome()
    }

    function openOptionsWelcome() {
        chrome.runtime.openOptionsPage();
    }

    function openOptionsDatabases() {
        openOptionsPath("/options.html#/manage/databases");
    }

    function openOptionsKeyfiles() {
        openOptionsPath("/options.html#/manage/keyfiles")
    }

    function openOptionsReauth(reauth_id) {
        openOptionsPath("/options.html#/reauthorize/" + reauth_id)
    }

    function openWebstore() {
        chrome.tabs.create({
            url: "https://chrome.google.com/webstore/detail/ckpx-chrome-keepass-exten/fmhmiaejopepamlcjkncpgpdjichnecm"
        })
    }

    function openHomepage() {
        chrome.tabs.create({
            url: "https://subdavis.com/Tusk"
        })
    }

    return my;
}
export {
    Links
}