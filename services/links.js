"use strict";

//simple service to link to the options page
function Links() {
  var my = {
    openOptions: openOptions,
    openWebstore: openWebstore
  }
  function openOptions () {
    chrome.runtime.openOptionsPage();
  }
  function openWebstore () {
  	chrome.tabs.create({url: "https://chrome.google.com/webstore/detail/ckpx-chrome-keepass-exten/fmhmiaejopepamlcjkncpgpdjichnecm"})
  }
  return my;
}
export { Links }