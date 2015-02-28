"use strict;"

//simple service to link to the options page
function OptionsLink() {
  var exports = {
    go: go
  }

  function go() {
    //from chrome 42 onward, per Xan on http://stackoverflow.com/questions/6782391/programmatically-open-a-chrome-plugins-options-html-page
    //chrome.runtime.openOptionsPage();

    //until then...
    var optionsUrl = "chrome://extensions/?options=" + chrome.runtime.id
    //  + '#!from=' + encodeURIComponent($location.path());  //doesn't work
    chrome.tabs.query({url: optionsUrl}, function(tabs) {
      if (tabs.length) {
        chrome.tabs.update(tabs[0].id, {active: true});
      } else {
        chrome.tabs.create({url: optionsUrl});
      }
    });
  }

  return exports;
}
